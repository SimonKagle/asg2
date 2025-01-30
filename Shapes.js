'use strict';

/**
 * Creates and draws buffer of points
 * @param {WebGLRenderingContext} gl WebGL rendering context
 * @param {Number} drawType Primitive type to pass to drawArrays
 * @param {Number} n Number of vertices per primative
 * @param {Float32Array} vertices Vertices of object
 * @param {Matrix4} matrix Model matrix
 * @param {Number[]} color RGB 0-1 color
 * @param {GLint} a_Position Attribute that positions primitive
 * @param {WebGLUniformLocation} u_FragColor Uniform that determines color of primitive
 * @param {WebGLUniformLocation} u_Matrix Uniform does matrix transform on the primative
 */
function drawPrimitive(gl, drawType, n, vertices, matrix, color, a_Position, u_FragColor, u_Matrix){

    gl.uniform4f(u_FragColor, ...color, 1);
    gl.uniformMatrix4fv(u_Matrix, false, matrix.elements);

    var vertBuffer = gl.createBuffer();
    if(!vertBuffer){
        throw new Error('Could not create buffer!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(drawType, 0, n);
}

class Shape {

    /**
     * 
     * @param {Matrix4} matrix Transformation Matrix
     * @param {Float32Array} color 
     * @param {Float32Array} vertices 
     */
    constructor(matrix, color, vertices){
        this.matrix = matrix;
        this.color = color;
        this.vertices = new Float32Array(vertices);
    }
    
    /**
     * Creates and draws buffer of points
     * @param {WebGLRenderingContext} gl WebGL rendering context
     * @param {Number} drawType Primitive type to pass to drawArrays
     * @param {Number} n Number of vertices per primative
     * @param {GLint} a_Position Attribute that positions primitive
     * @param {WebGLUniformLocation} u_FragColor Uniform that determines color of primitive
     */
    render(gl, drawType, n, a_Position, u_FragColor){

        gl.uniform4f(u_FragColor, ...this.color);

        var vertBuffer = gl.createBuffer();
        if(!vertBuffer){
            throw new Error('Could not create buffer!');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(drawType, 0, n);
    }
}

/**
 * Draws a 3D triangle onto the screen
 * @param {WebGLRenderingContext} gl Rendering context
 * @param {Float32Array} vertices Vertices of triangle
 * @param {Number[]} color Color of triangle
 * @param {Matrix4} matrix Transformation Matrix
 * @param {GLint} a_Position Position attribute to use in buffer
 * @param {WebGLUniformLocation} u_FragColor Color uniform
 * @param {WebGLUniformLocation} u_Matrix Matrix uniform
 */
function drawTriangle3D(gl, vertices, color, matrix, a_Position, u_FragColor, u_Matrix){
    gl.uniform4f(u_FragColor, ...color, 1);
    gl.uniformMatrix4fv(u_Matrix, false, matrix.elements);

    var vertBuffer = gl.createBuffer();
    if(!vertBuffer){
        throw new Error('Could not create buffer!');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

class Cube {

    baseVerts = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
    ]

    // Adapted from https://stackoverflow.com/questions/58772212/what-are-the-correct-vertices-and-indices-for-a-cube-using-this-mesh-function
    baseInd = [
        //Top
        2, 6, 7,
        2, 3, 7,

        //Bottom
        0, 4, 5,
        0, 1, 5,

        //Left
        0, 2, 6,
        0, 4, 6,

        //Right
        1, 3, 7,
        1, 5, 7,

        //Front
        0, 2, 3,
        0, 1, 3,

        //Back
        4, 6, 7,
        4, 5, 7
    ]

    /**
     * Cube constructor
     * @param {Matrix4} matrix Transformation Matrix
     * @param {Number[][] | Number[]} face_colors Color for each face or single color for all faces.
     * @param {Number[]} scale Scale of x, y, z faces
     * 
     * If specifying each color individually, the order is:
     *  1. Top
     *  2. Bottom
     *  3. Left
     *  4. Right
     *  5. Front
     *  6. Back 
     */
    constructor (matrix, face_colors, scale) {

        // Construct vertices, too lazy to do this by hand
        this.vertices = [];
        for (var i = 0; i < this.baseInd.length; i++){
            var [x, y, z] = this.baseVerts[this.baseInd[i]];
            this.vertices.push(
                (x - 0.5) * 2 * scale[0],
                (y - 0.5) * 2 * scale[1],
                (z - 0.5) * 2 * scale[2],
            )
        }
        this.vertices = new Float32Array(this.vertices);

        // Handle passing either a single color for whole cube, or one color per face
        if (!(face_colors[0] instanceof Array) && (face_colors instanceof Array)){
            this.face_colors = [];
            for (var i = 0; i < 8; i++){
                this.face_colors.push(face_colors);
            }
        } else {
            this.face_colors = face_colors;
        }


        this.matrix = matrix;
    }

    /**
     * Renders cube
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {GLint} a_Position Position Attribute
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     * @param {WebGLUniformLocation} u_Matrix Matrix uniform
     */
    render(gl, a_Position, u_FragColor, u_Matrix){
        for (var tri = 0; tri < this.vertices.length; tri += 9){
            drawTriangle3D(gl, this.vertices.slice(tri, tri + 9), 
                this.face_colors[Math.floor(tri / 18)], 
                this.matrix, a_Position, u_FragColor, u_Matrix);
        }
    }
}

class Cone {

    SEGMENTS = 10

    constructor(matrix, color, radius, height){
        this.matrix = matrix;
        this.color = color;

        this.base_vertices = [0, 0, 0];
        this.top_vertices = [0, height, 0];
        for (var i = 0; i <= this.SEGMENTS; i++){
            var angle = 2 * Math.PI / this.SEGMENTS * i;
            var vert = [
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
            ];
            this.base_vertices.push(...vert);
            this.top_vertices.push(...vert);
        }

        this.base_vertices = new Float32Array(this.base_vertices);
        this.top_vertices = new Float32Array(this.top_vertices);

    }

    /**
     * Renders cone
     * @param {WebGLRenderingContext} gl Rendering Context
     * @param {GLint} a_Position Position Attribute
     * @param {WebGLUniformLocation} u_FragColor Color uniform
     * @param {WebGLUniformLocation} u_Matrix Matrix uniform
     */
    render(gl, a_Position, u_FragColor, u_Matrix){
        drawPrimitive(gl, gl.TRIANGLE_FAN, 
            this.base_vertices.length / 3,
            this.base_vertices,
            this.matrix,
            this.color,
            a_Position, u_FragColor, u_Matrix
        );
        drawPrimitive(gl, gl.TRIANGLE_FAN, 
            this.top_vertices.length / 3,
            this.top_vertices,
            this.matrix,
            this.color,
            a_Position, u_FragColor, u_Matrix
        );
    }
}