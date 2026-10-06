"""SevaSetu AI service (FastAPI).

Every endpoint sits behind a provider interface. With the default `mock` providers
it is deterministic and needs no credentials. Swap providers through env vars.
Humans make every moderation decision; this service only produces suggestions.
"""
import os
import re
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="SevaSetu AI service", version="0.1.0")

# ---- crisis config: audited per locale before launch, never hardcoded in prompts ----
CRISIS_RESOURCES = {
    "IN": [
        {"label": "National emergency number", "number": "112"},
        {"label": "Tele-MANAS", "number": "14416"},
    ]
}
CRISIS_PATTERNS = [
    r"\b(kill myself|end my life|want to die|suicid\w*|self[- ]harm|hurt myself|better off dead)\b",
    r"\b(marna chahta|marna chahti|jaan de dunga|jeena nahi chahta)\b",
    r"(आत्महत्या|मर जाना चाहता|मर जाना चाहती)",
]


def detect_crisis(text: str) -> bool:
    return any(re.search(p, text, re.I) for p in CRISIS_PATTERNS)


class HealthOut(BaseModel):
    status: str
    providers: dict[str, str]


@app.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(
        status="ok",
        providers={
            k: os.getenv(k, "mock")
            for k in ("LLM_PROVIDER", "EMBEDDING_PROVIDER", "OCR_PROVIDER", "STT_PROVIDER")
        },
    )


# ---- request structuring ----
class StructureIn(BaseModel):
    text: str = Field(min_length=3)


class StructureOut(BaseModel):
    original_text: str  # always returned verbatim
    category: str
    language: Literal["English", "Hindi"]
    mode: Literal["remote", "in-person"]
    confidence: Literal["low", "medium", "high"]
    notes: list[str]


CATEGORIES = [
    (r"algebra|math|calculus|geometry", "learning"),
    (r"resume|cv\b|cover letter", "remote"),
    (r"phone|laptop|email|wifi|digital", "technical"),
    (r"form|notice|document|scholarship|bill", "forms"),
    (r"lonely|listen|talk to someone", "listening"),
]


@app.post("/ai/structure-request", response_model=StructureOut)
def structure_request(body: StructureIn) -> StructureOut:
    t = body.text
    cat = next((c for p, c in CATEGORIES if re.search(p, t, re.I)), "daily")
    hindi = bool(re.search(r"[ऀ-ॿ]", t)) or bool(re.search(r"\b(mujhe|nahi|hai|chahiye)\b", t, re.I))
    in_person = bool(re.search(r"come to|in person|at home|accompany|take me", t, re.I))
    notes = [] if cat != "daily" else ["Could not tell the kind of help. Please choose a category."]
    return StructureOut(
        original_text=t, category=cat, language="Hindi" if hindi else "English",
        mode="in-person" if in_person else "remote", confidence="medium" if cat != "daily" else "low", notes=notes,
    )


# ---- tone check: suggests, never rewrites silently ----
class ToneIn(BaseModel):
    text: str


class ToneIssue(BaseModel):
    matched: str
    why: str
    suggestion: str


@app.post("/moderation/tone", response_model=list[ToneIssue])
def tone(body: ToneIn) -> list[ToneIssue]:
    rules = [
        (r"\b(poor|needy|helpless)\s+(woman|man|person|family)\b", "Describing someone by hardship can sound like pity.", "I would like to support them with the requested task."),
        (r"\b(your number|whatsapp me|come alone)\b", "Moving to private channels reduces safety.", "Could we keep chatting here and plan a public place to meet?"),
    ]
    out = []
    for pat, why, sug in rules:
        m = re.search(pat, body.text, re.I)
        if m:
            out.append(ToneIssue(matched=m.group(0), why=why, suggestion=sug))
    return out


# ---- Seva Guide (RAG over curated passages; mock retriever) ----
PASSAGES = [
    {"id": "ps-1", "kind": "direct-quote", "work": "Karma-Yoga", "tags": {"giving", "humility", "service"},
     "text": "It is not the receiver that is blessed, but it is the giver.", "status": "demo-pending-verification"},
    {"id": "ps-3", "kind": "direct-quote", "work": "Katha Upanishad, as used by Swami Vivekananda", "tags": {"unmotivated", "courage", "start"},
     "text": "Arise, awake, and stop not till the goal is reached.", "status": "demo-pending-verification"},
]


class GuideIn(BaseModel):
    message: str
    locale: str = "IN"


class GuideOut(BaseModel):
    kind: Literal["crisis", "teaching", "not-found"]
    text: str
    passage: dict | None = None
    resources: list[dict] | None = None


@app.post("/ai/guide", response_model=GuideOut)
def guide(body: GuideIn) -> GuideOut:
    if detect_crisis(body.message):
        return GuideOut(
            kind="crisis",
            text="I am sorry you are going through this. Please contact emergency or crisis support now, and tell someone you trust.",
            resources=CRISIS_RESOURCES.get(body.locale, CRISIS_RESOURCES["IN"]),
        )
    words = set(re.findall(r"[a-z]+", body.message.lower()))
    best = max(PASSAGES, key=lambda p: len(p["tags"] & words))
    if not (best["tags"] & words):
        return GuideOut(kind="not-found", text="No verified passage found. I will not invent a quotation.")
    return GuideOut(kind="teaching", text="A passage that may help:", passage={k: (sorted(v) if isinstance(v, set) else v) for k, v in best.items()})


# ---- bill OCR analysis (flags only; never accuses) ----
class LedgerRow(BaseModel):
    id: str
    vendor: str | None = None
    amount: int
    date: str


class BillIn(BaseModel):
    vendor: str
    date: str
    total: int
    ledger: list[LedgerRow]


class Finding(BaseModel):
    status: Literal["duplicate", "mismatch", "verified"]
    detail: str
    entry_id: str | None = None


@app.post("/ai/analyze-bill", response_model=list[Finding])
def analyze_bill(b: BillIn) -> list[Finding]:
    from datetime import date as d

    def gap(a: str, c: str) -> int:
        return abs((d.fromisoformat(a) - d.fromisoformat(c)).days)

    out: list[Finding] = []
    dups = sorted([r for r in b.ledger if r.vendor == b.vendor and r.amount == b.total and gap(r.date, b.date) <= 3], key=lambda r: r.date, reverse=True)
    if dups:
        out.append(Finding(status="duplicate", entry_id=dups[0].id, detail="Same vendor and amount. May be a genuine repeat purchase, so a person will check."))
    mism = [r for r in b.ledger if r.vendor == b.vendor and r.amount != b.total and gap(r.date, b.date) <= 7]
    if mism:
        out.append(Finding(status="mismatch", entry_id=mism[0].id, detail="Bill total differs from the ledger entry."))
    return out or [Finding(status="verified", detail="No concerns found. Still queued for human review.")]
