let currentShape = null;
let extrusion = null;
let isExtrusionDone = false;
let vertices = [];
let extrusionHeight = 0.1;
const extrusionStep = 0.1;

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;

    // Create GUI
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const drawButton = createButton("drawButton", "Enter Draw Mode", "10px");
    const extrudeButton = createButton("extrudeButton", "Enter Extrude Mode", "60px");
    const moveButton = createButton("moveButton", "Enter Move Mode", "110px");
    const editButton = createButton("editButton", "Enter Edit Mode", "160px");

    let currentMode = 'none';
    let vertexSpheres = [];
    let selectedVertex = null;
    let startingPoint = null;

    function createButton(name, text, top) {
        const button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
        button.width = "150px";
        button.height = "40px";
        button.color = "white";
        button.cornerRadius = 20;
        button.background = "green";
        button.top = top;
        button.left = "10px";
        advancedTexture.addControl(button);
        return button;
    }
    // Function to set the current mode
    function setMode(mode) {
        currentMode = mode;
        [drawButton, extrudeButton, moveButton, editButton].forEach(btn => {
            btn.background = btn.name.includes(mode) ? "red" : "green";
        });
        if (mode === 'edit' && isExtrusionDone) {
            enableVertexEditing();
        } else {
            disableVertexEditing();
        }
    }
    // Set up event listeners for the buttons
    drawButton.onPointerUpObservable.add(() => setMode(currentMode === 'draw' ? 'none' : 'draw'));
    extrudeButton.onPointerUpObservable.add(() => setMode(currentMode === 'extrude' ? 'none' : 'extrude'));
    moveButton.onPointerUpObservable.add(() => setMode(currentMode === 'move' ? 'none' : 'move'));
    editButton.onPointerUpObservable.add(() => setMode(currentMode === 'edit' ? 'none' : 'edit'));
    // Enable vertex editing by creating spheres at vertex positions
    function enableVertexEditing() {
        const vertexSize = 0.05;
        const positions = extrusion.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < positions.length;  i += 3) {
            const vertex = BABYLON.MeshBuilder.CreateSphere("vertex" + i, {diameter: vertexSize}, scene);
            vertex.position = new BABYLON.Vector3(positions[i], positions[i+1], positions[i+2]);
            vertex.originalIndex = i;
            vertexSpheres.push(vertex);
        }
    }
    // Disable vertex editing by disposing of the spheres
    function disableVertexEditing() {
        vertexSpheres.forEach(sphere => sphere.dispose());
        vertexSpheres = [];
    }
    // Get the position on the ground where the user clicked
    function getGroundPosition() {
        const pickinfo = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === ground);
        return pickinfo.hit ? pickinfo.pickedPoint : null;
    }
    //add vertex
    function addVertex(position) {
        vertices.push(position);
        if (vertices.length > 1) {
            const line = BABYLON.MeshBuilder.CreateLines("line", {points: [vertices[vertices.length - 2], position]}, scene);
        }
    }
    //closing the shape and beginning extrusion
    function closeShape() {
        if (vertices.length > 2) {
            BABYLON.MeshBuilder.CreateLines("closingLine", {points: [vertices[vertices.length - 1], vertices[0]]}, scene);
            const polygon = new BABYLON.PolygonMeshBuilder("polygon", vertices.map(v => new BABYLON.Vector2(v.x, v.z)), scene);
            currentShape = polygon.build();
            currentShape.position.y = 0.01;
            extrudeShape();
            vertices = [];
        }
    }
    //logic to extrude shape
    function extrudeShape() {
        if (currentShape) {
            if (extrusion) extrusion.dispose();

            const shape = currentShape.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = currentShape.getIndices();
            const points = [];
            for (let i = 0; i < shape.length; i += 3) {
                points.push(new BABYLON.Vector3(shape[i], shape[i + 1], shape[i + 2]));
            }

            // Create positions, indices, and normals for the extruded mesh
            const positions = [];
            const extrudedIndices = [];
            const normals = [];

            // Add top face (original shape)
            for (let i = 0; i < shape.length; i += 3) {
                positions.push(shape[i], shape[i + 1] + extrusionHeight, shape[i + 2]);
            }

            // Add bottom face
            for (let i = 0; i < shape.length; i += 3) {
                positions.push(shape[i], shape[i + 1], shape[i + 2]);
            }

            // Add side faces
            for (let i = 0; i < points.length; i++) {
                const nextI = (i + 1) % points.length;
                const topIndex1 = i;
                const topIndex2 = nextI;
                const bottomIndex1 = i + points.length;
                const bottomIndex2 = nextI + points.length;

                // Add two triangles for each side face
                extrudedIndices.push(
                    topIndex1, bottomIndex1, topIndex2,
                    topIndex2, bottomIndex1, bottomIndex2
                );

                // Calculate normal for the side face
                const side = BABYLON.Vector3.Normalize(points[nextI].subtract(points[i]));
                const up = new BABYLON.Vector3(0, 1, 0);
                const normal = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(side, up));

                // Add normals for the four vertices of this side face
                for (let j = 0; j < 4; j++) {
                    normals.push(normal.x, normal.y, normal.z);
                }
            }

            // Add indices for top and bottom faces
            for (let i = 0; i < indices.length; i += 3) {
                // Top face (winding order preserved)
                extrudedIndices.push(indices[i], indices[i + 1], indices[i + 2]);
                // Bottom face (reverse winding order)
                extrudedIndices.push(indices[i] + points.length, indices[i + 2] + points.length, indices[i + 1] + points.length);
            }

            // Create the custom mesh
            extrusion = new BABYLON.Mesh("extrudedShape", scene);

            // Create vertex data
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = positions;
            vertexData.indices = extrudedIndices;
            vertexData.normals = normals;

            // Apply vertex data to the mesh
            vertexData.applyToMesh(extrusion, true);

            extrusion.position.y = 0;
            currentShape.isVisible = false;
            isExtrusionDone = true;

            // Compute normals for top and bottom faces
            BABYLON.VertexData.ComputeNormals(positions, extrudedIndices, normals);
            extrusion.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        }
    }

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                onPointerDown(pointerInfo.event);
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                onPointerUp(pointerInfo.event);
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                onPointerMove();
                break;
        }
    });
    //next steps onpointerdown according to mode
    function onPointerDown(evt) {
        if (evt.button !== 0) return;
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult.hit) {
            switch (currentMode) {
                case 'draw':
                    const groundPos = getGroundPosition();
                    if (groundPos) addVertex(groundPos);
                    break;
                case 'move':
                    if (pickResult.pickedMesh === extrusion) {
                        startingPoint = getGroundPosition();
                    }
                    break;
                case 'edit':
                    const clickedPosition = pickResult.pickedPoint;
                    let closestVertex = vertexSpheres.reduce((closest, sphere) => {
                        const distance = BABYLON.Vector3.Distance(clickedPosition, sphere.position);
                        return distance < closest.distance ? {sphere, distance} : closest;
                    }, {sphere: null, distance: Infinity}).sphere;
                    if (closestVertex) {
                        selectedVertex = closestVertex;
                        startingPoint = getGroundPosition();
                    }
                    break;
            }
        }
    }

    function onPointerUp(evt) {
        if (currentMode === 'draw' && evt.button === 2) {
            closeShape();
        }
        if (selectedVertex) {
            if (currentMode === 'edit') updateMesh();
            selectedVertex = null;
            startingPoint = null;
        }
    }

    function onPointerMove() {
        if (!startingPoint) return;
        const currentPosition = getGroundPosition();
        if (!currentPosition) return;
        const diff = currentPosition.subtract(startingPoint);
        if (currentMode === 'move') {
            extrusion.position.addInPlace(diff);
        } else if (currentMode === 'edit' && selectedVertex) {
            selectedVertex.position.addInPlace(diff);
        }
        startingPoint = currentPosition;
    }
    //update old mesh
    function updateMesh() {
    const positions = extrusion.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = extrusion.getIndices();
    const normals = extrusion.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    vertexSpheres.forEach(sphere => {
        const worldPosition = sphere.getAbsolutePosition();
        positions[sphere.originalIndex] = worldPosition.x;
        positions[sphere.originalIndex + 1] = worldPosition.y;
        positions[sphere.originalIndex + 2] = worldPosition.z;
    });
    extrusion.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    // Recompute normals
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    extrusion.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    }
    //adding height onkeyboard event
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && currentMode === 'extrude') {
            let heightChanged = false;
            if (kbInfo.event.key === "ArrowUp") {
                extrusionHeight += extrusionStep;
                heightChanged = true;
            } else if (kbInfo.event.key === "ArrowDown" && extrusionHeight > extrusionStep) {
                extrusionHeight -= extrusionStep;
                heightChanged = true;
            }
            if (heightChanged) extrudeShape();
        }
    });

    scene.getEngine().getRenderingCanvas().addEventListener("contextmenu", (e) => e.preventDefault());

    return scene;
};