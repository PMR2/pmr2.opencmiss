var animation = 0;
var container, stats;
var camera, scene, renderer;

var tumble_rate = 1.5;
var morphs = [];
var myGeometry = [];
var clock = new THREE.Clock();
var directionalLight = 0;
var duration = 3000;

var viewer_settings = {
    "near_plane": 10.0353320682268,
    "far_plane": 12.6264735624,
    "eye_position": [0.5, 0.5, 4.033206822678309],
    "up_vector": [ 0.0, 1.0, 0.0],
    "target_position": [0.5, 0.5, 0.5]
}

var centroid = [0, 0, 0]
var timeEnabled = false;
var morphColour = [false];

// TODO determine these from input.
var modelsColours=[0x9F2F2A];
var num_of_mesh = 1;

var zincCameraControls;
var viewer;


$(document).ready(function() {
    // TODO find container from body
    viewer = $('#zinc_webgl_viewer');
    if (viewer.length != 1) {
        return
    }

    // TODO ensure this is a POST to the generation endpoint.
    $.getJSON(viewer.data('src'), function(data) {
        init(viewer, data);
        animate();
    });
});

function resetView()
{
    camera.near = viewer_settings.near_plane;
    camera.far = viewer_settings.far_plane;
    camera.position = new THREE.Vector3(
        viewer_settings.eye_position[0],
        viewer_settings.eye_position[1],
        viewer_settings.eye_position[2]);
    camera.target = new THREE.Vector3(
        viewer_settings.target_position[0],
        viewer_settings.target_position[1],
        viewer_settings.target_position[2]);
    camera.up.set(
        viewer_settings.up_vector[0],
        viewer_settings.up_vector[1],
        viewer_settings.up_vector[2]);
    camera.aspect = viewer.width() / viewer.height();
    camera.updateProjectionMatrix();
}

function createDataText()
{
    var text2 = document.getElementById('myText');
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.display="none"
    text2.style.width = 100;
    text2.style.height = 50;
    text2.style.backgroundColor = "black";
    text2.innerHTML = "Delta: 0";
    text2.style.top = (window.innerHeight - 100) + 'px';
    text2.style.left = 10 + 'px';		
}			

function setPositionOfObject(mesh)
{
    geometry = mesh.geometry;
    geometry.computeBoundingBox();
    
    var centerX = 0.5 * (geometry.boundingBox.min.x + geometry.boundingBox.max.x );
    var centerY = 0.5 * (geometry.boundingBox.min.y + geometry.boundingBox.max.y );
    var centerZ = 0.5 * (geometry.boundingBox.min.z + geometry.boundingBox.max.z );
    centroid = [ centerX, centerY, centerZ]
}

function meshloader(geometry) {
    var material = new THREE.MeshLambertMaterial({
        color: modelsColours[0],
        morphTargets: timeEnabled,
        morphNormals: false,
        vertexColors: THREE.VertexColors
    });
    material.side = THREE.DoubleSide;
    var meshAnim = new THREE.MorphAnimMesh(geometry, material);
    if (timeEnabled == true) {
        meshAnim = new THREE.MorphAnimMesh(geometry, material);
        geometry.computeMorphNormals(meshAnim);
        meshAnim.duration = duration;
        morphs.push(meshAnim);
    }
    else {
        meshAnim = new THREE.Mesh(geometry, material)
    }

    setPositionOfObject(meshAnim);
    scene.add(meshAnim);
    myGeometry.push(geometry) ;
}

function init(container, data) {
    if (data.viewer_settings) {
        viewer_settings = data.viewer_settings;
    }
    camera = new THREE.PerspectiveCamera(
        40,
        viewer.width() / viewer.height(),
        viewer_settings.near_plane,
        viewer_settings.far_plane);
    resetView();
    createDataText();
      
    projector = new THREE.Projector();
    scene = new THREE.Scene();
    var ambient = new THREE.AmbientLight( 0x171717 );
    scene.add(ambient);

    directionalLight = new THREE.DirectionalLight(0xE0E0E0);
    directionalLight.position.set(
        viewer_settings.eye_position[0],
        viewer_settings.eye_position[1],
        viewer_settings.eye_position[2]);
    scene.add(directionalLight);			

    var loader = new THREE.JSONLoader( true );
    result = loader.parse(data.scene)
    meshloader(result.geometry); 

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewer.width(), viewer.height());
    container.append(renderer.domElement);
    renderer.setClearColor( 0x000000, 1);
    zincCameraControls = new ZincCameraControls(
        camera, renderer.domElement, renderer, scene)
    zincCameraControls.setDirectionalLight(directionalLight);
    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = viewer.width() / viewer.height();
    camera.updateProjectionMatrix();

    renderer.setSize(viewer.width(), viewer.height());

}

function getColorsRGB(colors, index)
{
    var index_in_colors = Math.floor(index/3);
    var remainder = index%3;
    var hex_value = 0;
    if (remainder == 0)
    {
        hex_value = colors[index_in_colors].r
    }
    else if (remainder == 1)
    {
        hex_value = colors[index_in_colors].g
    }
    else if (remainder == 2)
    {
        hex_value = colors[index_in_colors].b
    }
    var mycolor = new THREE.Color(hex_value);
    return [mycolor.r, mycolor.g, mycolor.b];
    
}

/* function to make sure each vertex got the right colour at the right time,
    it will linearly interpolate colour between time steps */
function morphColorsToVertexColors( geometry, morph ) {
    if ( morph && geometry.morphColors && geometry.morphColors.length ) {
        var current_time = morph.time/morph.duration * (geometry.morphColors.length - 1)
        var bottom_frame =  Math.floor(current_time)
        var proportion = 1 - (current_time - bottom_frame)
        var top_frame =  Math.ceil(current_time)
        var bottomColorMap = geometry.morphColors[ bottom_frame ];
        var TopColorMap = geometry.morphColors[ top_frame ];
        for ( var i = 0; i < geometry.faces.length; i ++ ) {
            var my_color1 = getColorsRGB(bottomColorMap.colors, geometry.faces[i].a);
            var my_color2 = getColorsRGB(TopColorMap.colors, geometry.faces[i].a);
            var resulting_color = [my_color1[0] * proportion + my_color2[0] * (1 - proportion),
                my_color1[1] * proportion + my_color2[1] * (1 - proportion),
                my_color1[2] * proportion + my_color2[2] * (1 - proportion)]
            geometry.faces[i].vertexColors[0].setRGB(resulting_color[0], resulting_color[1], resulting_color[2])
            my_color1 = getColorsRGB(bottomColorMap.colors, geometry.faces[i].b);
            my_color2 = getColorsRGB(TopColorMap.colors, geometry.faces[i].b);
            resulting_color = [my_color1[0] * proportion + my_color2[0] * (1 - proportion),
                my_color1[1] * proportion + my_color2[1] * (1 - proportion),
                my_color1[2] * proportion + my_color2[2] * (1 - proportion)]
            geometry.faces[i].vertexColors[1].setRGB(resulting_color[0], resulting_color[1], resulting_color[2])
            my_color1 = getColorsRGB(bottomColorMap.colors, geometry.faces[i].c);
            my_color2 = getColorsRGB(TopColorMap.colors, geometry.faces[i].c);
            resulting_color = [my_color1[0] * proportion + my_color2[0] * (1 - proportion),
                my_color1[1] * proportion + my_color2[1] * (1 - proportion),
                my_color1[2] * proportion + my_color2[2] * (1 - proportion)]
            geometry.faces[i].vertexColors[2].setRGB(resulting_color[0], resulting_color[1], resulting_color[2])
        }	
    }
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

var prevTime = Date.now();

function render() {

    var delta = clock.getDelta();
    zincCameraControls.update()
    /* the following check make sure all models are loaded and synchonised */
    if (myGeometry.length == num_of_mesh) {
        if (timeEnabled == true) {		
            for ( var i = 0; i < myGeometry.length; i ++ ) {
                if (morphColour[i] == true) {
                    if (typeof myGeometry[i] !== "undefined") {
                        morphColorsToVertexColors(myGeometry[i], morphs[i])
                        myGeometry[i].colorsNeedUpdate = true;
                    }
                }
            }
            for ( var i = 0; i < morphs.length; i ++ ) {
                morph = morphs[ i ];
                morph.updateAnimation( 500 * delta );
            }
        }
    }
    renderer.render( scene, camera );
}
