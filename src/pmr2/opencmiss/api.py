import json

from opencmiss.zinc.context import Context
from opencmiss.zinc.sceneviewer import Sceneviewer


def _to_threejs(region_data, graphics_description, subregion_path=''):
    """
    Turns the input ``region_data`` and ``graphics_description`` into
    ThreeJS compatible JSON.
    """

    context = Context("graphicsToThreeJS")
    root_region = context.getDefaultRegion()
    csir = root_region.createStreaminformationRegion()
    csir.createStreamresourceMemoryBuffer(region_data)
    root_region.read(csir)

    child_region = root_region.findSubregionAtPath(subregion_path)
    scene = child_region.getScene()

    if graphics_description:
        si = scene.createStreaminformationScene()
        si.setIOFormat(si.IO_FORMAT_GRAPHICS_DESCRIPTION)
        si.createStreamresourceMemoryBuffer(graphics_description)
        scene.importScene(si)

    svm = context.getSceneviewermodule()
    sv = svm.createSceneviewer(Sceneviewer.BUFFERING_MODE_DEFAULT,
        Sceneviewer.STEREO_MODE_DEFAULT)
    sv.setScene(scene)
    excsis = scene.createStreaminformationScene()
    excsis.setIOFormat(excsis.IO_FORMAT_THREEJS)
    excsis.setIODataType(excsis.IO_DATA_TYPE_COLOUR)
    req = excsis.getNumberOfResourcesRequired()
    scenes = [excsis.createStreamresourceMemory() for x in xrange(req)]
    scene.exportScene(excsis)
    retcode, scene_buffer = scenes[0].getBuffer()
         
    sv.viewAll()
    retcode, eyePosition, targetPosition, upVector = sv.getLookatParameters()
    viewer_settings = {
        "near_plane": sv.getNearClippingPlane(),
        "far_plane": sv.getFarClippingPlane(),
        "eye_position": eyePosition,
        "target_position": targetPosition,
        "up_vector": upVector,
    }

    return {
        "scene": json.loads(scene_buffer),
        "viewer_settings": viewer_settings,
    }

def to_threejs(region_data, graphics_description, subregion_path=''):
    return json.dumps(
        _to_threejs(region_data, graphics_description, subregion_path))
