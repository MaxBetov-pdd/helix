from fastapi import APIRouter, Depends, Request, Response, WebSocket

from helix import api_core as core
from helix.api_domains import legacy as legacy_domain
from helix.api_security import require_operator_access
from helix.control_plane.models import QueueProcessingBody

router = APIRouter(tags=["legacy"], dependencies=[Depends(require_operator_access)])


@router.put("/api/helix/model-policy", deprecated=True)
def put_legacy_model_policy(body: core.ModelPolicyUpdateBody, response: Response):
    legacy_domain.apply_legacy_response_headers(response, "/api/helix/model-policy")
    return legacy_domain.put_legacy_model_policy(body)


@router.patch("/api/helix/agents/{agent_id}", deprecated=True)
def legacy_patch_agent(agent_id: str, body: core.LegacyAgentUpdateBody, response: Response):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/agents/{agent_id}")
    return legacy_domain.legacy_patch_agent(agent_id, body)


@router.put("/api/helix/agents/{agent_id}/documents/{document}", deprecated=True)
def legacy_put_agent_document(
    agent_id: str,
    document: str,
    body: core.LegacyAgentDocumentBody,
    response: Response,
):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/agents/{agent_id}/documents/{document}")
    return legacy_domain.legacy_put_agent_document(agent_id, document, body)


@router.patch("/api/helix/agents/{agent_id}/model", deprecated=True)
def legacy_patch_agent_model(agent_id: str, body: core.LegacyAgentModelBody, response: Response):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/agents/{agent_id}/model")
    return legacy_domain.legacy_patch_agent_model(agent_id, body)


@router.post("/api/helix/agents/{agent_id}/test-discord", deprecated=True)
def legacy_post_agent_test_discord(
    agent_id: str,
    response: Response,
    body: core.AgentDiscordTestBody | None = None,
):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/agents/{agent_id}/test-discord")
    return legacy_domain.legacy_post_agent_test_discord(agent_id, body)


@router.post("/api/helix/agent-tasks/process", deprecated=True)
async def legacy_post_agent_task_queues(body: QueueProcessingBody, response: Response):
    legacy_domain.apply_legacy_response_headers(response, "/api/helix/agent-tasks/process")
    return await legacy_domain.legacy_post_agent_task_queues(body)


@router.post("/api/helix/brain/chat", status_code=202, deprecated=True)
def post_brain_chat_legacy(body: core.BrainChatBody, response: Response):
    legacy_domain.apply_legacy_response_headers(response, "/api/helix/brain/chat")
    return legacy_domain.post_brain_chat_legacy(body)


@router.get("/api/helix/brain/chat/{task_id}", deprecated=True)
def get_brain_chat_result_legacy(task_id: int, response: Response):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/brain/chat/{task_id}")
    return legacy_domain.get_brain_chat_result_legacy(task_id, response)


@router.get("/api/helix/{legacy_path:path}", deprecated=True)
def legacy_helix_get(legacy_path: str, request: Request, response: Response, limit: int = 50):
    legacy_domain.apply_legacy_response_headers(response, f"/api/helix/{legacy_path}")
    return legacy_domain.legacy_helix_get(legacy_path, request, limit=limit)


@router.websocket("/api/helix/ws/live")
@router.websocket("/helix/ws/live")
async def legacy_websocket_endpoint(ws: WebSocket):
    legacy_domain.log.warning(
        "Legacy websocket route used: /api/helix/ws/live (scheduled sunset %s)",
        legacy_domain.LEGACY_API_SUNSET_DATE,
    )
    await legacy_domain.legacy_websocket_endpoint(ws)
