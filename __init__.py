# comfy-extra-ui — extension web (aucune node backend).
# Expose le dossier ./web que ComfyUI charge automatiquement
# (servi à /extensions/comfy-extra-ui/*).

WEB_DIRECTORY = "./web"

NODE_CLASS_MAPPINGS: dict = {}
NODE_DISPLAY_NAME_MAPPINGS: dict = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
