from fastapi import APIRouter

router = APIRouter()


@router.post("/query")
def query_chatbot(payload: dict):
    # Placeholder chatbot endpoint
    return {"response": "not implemented"}
