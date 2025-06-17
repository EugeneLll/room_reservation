from rest_framework.serializers import Serializer


class SplitDetailListSerializerViewSetMixin:
    list_serializer: Serializer | None = None
    detail_serialzier: Serializer | None = None

    def get_serializer_class(self):
        if self.action == "list" and self.list_serializer is not None:
            return self.list_serializer
        elif self.detail_serialzier is not None:
            return self.detail_serialzier
        return super().get_serializer_class()
