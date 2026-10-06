import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

c = TestClient(app)


def test_health():
    assert c.get("/health").json()["status"] == "ok"


def test_structure_keeps_original():
    t = "I am finding algebra difficult, maybe online on Saturday"
    r = c.post("/ai/structure-request", json={"text": t}).json()
    assert r["original_text"] == t and r["category"] == "learning" and r["mode"] == "remote"


def test_tone_suggests_not_rewrites():
    r = c.post("/moderation/tone", json={"text": "I want to help this poor woman"}).json()
    assert r and "support" in r[0]["suggestion"]


def test_guide_crisis_routes_to_resources_not_philosophy():
    r = c.post("/ai/guide", json={"message": "I want to end my life"}).json()
    assert r["kind"] == "crisis" and r["passage"] is None and r["resources"]


def test_guide_does_not_invent_quotes():
    assert c.post("/ai/guide", json={"message": "quantum lattice"}).json()["kind"] == "not-found"


def test_bill_flags_duplicate_without_accusing():
    body = {"vendor": "Gupta", "date": "2026-09-22", "total": 4150,
            "ledger": [{"id": "l-3", "vendor": "Gupta", "amount": 4150, "date": "2026-09-22"}, {"id": "l-4", "vendor": "Gupta", "amount": 4150, "date": "2026-09-23"}]}
    r = c.post("/ai/analyze-bill", json=body).json()
    assert r[0]["status"] == "duplicate" and r[0]["entry_id"] == "l-4" and "genuine" in r[0]["detail"]
