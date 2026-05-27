import asyncio
from functools import partial
import cloudinary
import cloudinary.uploader
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_file(content: bytes, resource_type: str = "auto") -> dict:
    loop = asyncio.get_event_loop()

    kwargs = {
        "folder": "mur-lsdj",
        "resource_type": resource_type,
    }
    if resource_type == "image":
        kwargs["eager"] = [{"width": 600, "height": 400, "crop": "fill", "format": "jpg", "quality": "auto"}]

    result = await loop.run_in_executor(
        None, partial(cloudinary.uploader.upload, content, **kwargs)
    )

    thumbnail_url = None
    if result.get("eager"):
        thumbnail_url = result["eager"][0]["secure_url"]
    elif resource_type == "video":
        # Génère une miniature statique depuis la première seconde de la vidéo
        thumbnail_url = result["secure_url"].replace("/video/upload/", "/video/upload/so_0,w_600,h_400,c_fill,f_jpg/")

    return {
        "file_url": result["secure_url"],
        "thumbnail_url": thumbnail_url or result["secure_url"],
        "public_id": result["public_id"],
    }
