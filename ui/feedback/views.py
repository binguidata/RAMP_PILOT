from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from feedback.models import Feedback
from feedback.serializers import FeedbackSerializer
from jwt_handler.permission import has_access_rights

# Create your views here.
@api_view(['GET'])
def list_feedback(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    feedback = Feedback.objects.all()
    serializer = FeedbackSerializer(feedback, many=True)
    return Response(serializer.data, status=200)


@api_view(['GET'])
def get_feedback(request, pk):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    feedback = Feedback.objects.get(pk=pk)
    serializer = FeedbackSerializer(feedback)
    return Response(serializer.data, status=200)


@api_view(['POST'])
def create_feedback(request):
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)
