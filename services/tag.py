from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database.models import Tag, TagName, Shipment
from services.base import BaseService

class TagService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(Tag, session)
        
    async def get_shipments_by_tag(self, tag_name: TagName) -> list[Shipment]:
        # Fetch the Tag entity by name and eagerly load shipments along with their tags and timelines
        stmt = (
            select(Tag)
            .where(Tag.name == tag_name)
            .options(
                selectinload(Tag.shipments).selectinload(Shipment.tags),
                selectinload(Tag.shipments).selectinload(Shipment.timeline)
            )
        )
        tag = await self.session.scalar(stmt)
        if not tag:
            return []
        return tag.shipments
