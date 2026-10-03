from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.verify import VerifyRequest, VerifyResponse
from app.services.ai_input_sanitizer import InputValidationError
from app.services.verification_submit import submit_verify_request

router = APIRouter()


@router.post("", response_model=VerifyResponse)
async def verify_submission(
    body: VerifyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    try:
        return await submit_verify_request(db, background_tasks, body.text, body.url)
    except InputValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
