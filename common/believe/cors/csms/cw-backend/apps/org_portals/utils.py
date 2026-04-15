from utils.loggerwrapper import Logger
from .serializers import ContentSerializer, PortalSerializer, PortalContentOrderBasicSerializer

logger = Logger(__name__)

def create_default_content():
    try:
        # context = {}
        html_content = '''
            <h3>Welcome to our organisation</h3>
            <p>To change the content of this page follow the steps:</p>
            <ul>
            <li>Login to your organisation app.</li>
            <li>Navigate to Config &gt; Portals &gt; Content</li>
            <li>You can see the Welcome Content in 'Published Content'</li>
            <li>From here you can edit the existing Content or create a new content that you can show to your onboarding-candidate in the candidate app.</li>
            <li>You can create multiple Content and after publishing them, you can associate them to a Portal and also change the order of Contents.</li>
            <li>From Config &gt; Portals, you can assign one or more Workflows to the Content that you have created.</li>
            </ul><p>
            <br></p>
        '''
        description = 'This is your default content description'
        name = 'Welcome'
        data = {
            'content':html_content,
            'is_published': True,
            'description':description,
            'name':name
        }
        serializer = ContentSerializer(data=data)
        if serializer.is_valid():
            obj = serializer.save()
            logger.info('Default content created successfully')
            return obj.id
        logger.error("Failed to create content. Reason: {}".format(serializer.errors))
        return False
    except Exception as error:
        logger.exception("Failed to create default content, due to : {}".format(error))
        return False



def create_default_portal():
    try:
        data = {
            'name': 'Welcome',
            'description': 'This is your default portal description'
        }
        serializer = PortalSerializer(data=data)
        if serializer.is_valid():
            obj = serializer.save()
            logger.info('Default portal created.')
            return obj.id
        logger.error("Failed to create portal. Reason: {}".format(serializer.errors))
        return False
    except Exception as error:
        logger.exception("Failed to create default portal , due to : {}".format(error))
        return False

def associate_default_content(content, portal):
    try:
        data = {
            'order':0,
            'content':content,
            'portal':portal
        }
        serializer = PortalContentOrderBasicSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            logger.info("Portal content order created successfully.")
            return True
        logger.error("Failed to create portal content order, due to: {}".format(serializer.errors))
        return False
    except Exception as error:
        logger.exception("Failed to create portal content order, due to : {}".format(error))
        return False


def create_default_content_and_portal_and_associate():
    try:
        portal = create_default_portal()
        content = create_default_content()
        if portal and content:
            associated = associate_default_content(content, portal)
            if associated:
                return True
        logger.error("Failed to create Default portal or Default content")
        return False
    except Exception as error:
        logger.exception("Failed to create portal content order, due to : {}".format(error))
        return False
