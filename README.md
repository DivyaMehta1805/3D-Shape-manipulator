# 3D Shape Creator and Editor

## Overview
Link to the project in action: https://playground.babylonjs.com/#O7JLEF

The 3D Shape Creator and Editor is an interactive tool built with Babylon.js that enables users to create and edit 3D shapes. Users can draw 2D shapes on a ground plane, extrude them into 3D objects, move these objects in the scene, and modify individual vertices. The tool is designed with an intuitive GUI to streamline the user experience.

## Features

- **Draw Mode**: Create 2D shapes by clicking on a ground plane.
- ![image](https://github.com/user-attachments/assets/4a1b715c-5a60-4420-bc8e-7d6bdaa86e1a)

- **Extrude Mode**: Convert 2D shapes into 3D objects with adjustable extrusion height.
- ![image](https://github.com/user-attachments/assets/bd171dec-b3ab-442a-8af7-a67863047026)

- **Move Mode**: Reposition the 3D object within the scene.
- ![image](https://github.com/user-attachments/assets/7b46a6ad-29c7-430f-b498-97eb375ec40e)

- **Vertex Edit Mode**: Modify individual vertices of the 3D object.
- ![image](https://github.com/user-attachments/assets/9d930ee9-4896-4336-967a-8e6415cc98ce)

- **Interactive GUI**: Easy-to-use buttons for switching between different modes.

## Getting Started

## Button Functionalities

### Draw Mode
- **Activated by clicking the "Enter Draw Mode" button**
- Users click on the ground to add vertices, forming the shape's outline.
- Right-click to close the shape and complete the drawing.

### Extrude Mode
- **Activated by clicking the "Enter Extrude Mode" button**
- Enables users to give height to the 2D shape, creating a 3D object.
- Use the up and down arrow keys to increase or decrease the extrusion height.
- The shape updates in real-time as the height changes.

### Move Mode
- **Activated by clicking the "Enter Move Mode" button**
- Allows users to reposition the object.
- Click and drag the object to move it across the ground plane.
- Once the object is dropped to it's new position the move mode automatically gets disabled.

### Edit Mode
- **Activated by clicking the "Enter Edit Mode" button**
- Vertex points appear on the object, which can be clicked and dragged to adjust the shape as needed.

## Implementation Details

### Draw Mode
- The draw mode is the foundation of the shape creation process. It utilizes a click-based system to define vertices on a ground plane.
  - Initialize an empty array to store vertex positions.
  - On each click, capture the ground position and add it to the vertex array.
  - Draw lines between consecutive vertices to visualize the shape.
  - On right-click, close the shape by connecting the last vertex to the first.
  - Create a polygon mesh from the vertices.

### Extrude Mode
- Use the original shape as the base.
  - Create a top face by duplicating and elevating the base vertices.
  - Generate side faces by connecting corresponding vertices of the top and bottom faces.
  - Calculate and apply appropriate normals for proper lighting.
  - Update the mesh in real-time as the extrusion height changes.

### Move Mode
- The move functionality provides a way to reposition the object.
  - Capture the initial click position on the ground.
  - Calculate the difference between the current and initial positions during dragging.
  - Update all vertex positions of the mesh by this difference.

### Edit Mode
- Edit mode offers control over the object's shape.
  - Creates small spheres at each vertex of the extruded shape.
  - Enable these spheres to be selected and moved.
  - Update the underlying mesh geometry when a vertex is moved.
  - Recalculate normals to ensure proper lighting after edits.
  - Note: For best results in complex 3-d shapes one might have to rotate the camera to focus on the side of the vertex that has to be edited.

## General Design Considerations
- **Mode Switching**: Each mode is mutually exclusive, ensuring clear user focus on the current task.
- **Visual Feedback**: Buttons change color to indicate the active mode.
- **Camera Control**: Camera movement is disabled during shape manipulation to prevent accidental changes.
- **User Experience**: Intuitive controls (click to draw, arrow keys for extrusion) make the tool accessible to users with varying levels of 3D modeling experience.

