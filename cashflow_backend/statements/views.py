from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import service
from .parser import StatementError


def _money(value):
    return f"{value:.2f}"


def _errors(plan):
    return [{"row": e.row, "message": e.message} for e in plan.errors]


class _StatementView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def read(self, request):
        upload = request.data.get("file")
        if upload is None:
            raise StatementError("Please choose a statement file (CSV).")
        return upload.read()


class PreviewView(_StatementView):
    """SI-13: shows what would happen; saves nothing."""

    def post(self, request):
        try:
            plan = service.plan(request.user, self.read(request))
        except StatementError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "summary": plan.summary,
            "rows": [{"row": r.row, "date": r.date.isoformat(), "description": r.description, "amount": _money(r.amount),
                      "direction": r.direction, "category": r.category, "status": state} for r, state in plan.rows],
            "errors": _errors(plan),
        })


class ImportView(_StatementView):
    def post(self, request):
        try:
            applied = service.save(request.user, self.read(request))
        except StatementError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        summary = applied.summary
        return Response({"imported": summary["new"], "duplicates": summary["duplicates"], "errors": _errors(applied)},
                        status=status.HTTP_201_CREATED if summary["new"] else status.HTTP_200_OK)
