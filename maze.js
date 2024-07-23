// // Maze Gneration using Recursive Backtracking Algorithm
// // Bunch of cell in a grid having four lines : top, right, bottom, left.
var cols, rows;
var w = 40; // width
var grid = []; // 1D array
var current;

function setup() {
    createCanvas(400, 400);
    cols = floor(width / w);
    rows = floor(height / w);

    for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }

    current = grid[0];
}

function draw() {
    background(51);
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }

    current.visited = true;
    current.highlight();
    // STEP 1
    var next = current.check_neighbors();
    if (next) {
        next.visited = true;
        // STEP 3
        removeWalls(current, next);
        // STEP 4
        current = next;
    }
}

function index(i, j) {
    if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) {
        return -1;
    }
    return i + j * cols;
}

class Cell {
    constructor(i, j) {
        this.i = i; // Column number
        this.j = j; // Row number
        this.walls = [true, true, true, true];
        this.visited = false;
    }

    check_neighbors() {
        var neighbors = [];

        var top = grid[index(this.i, this.j - 1)];
        var right = grid[index(this.i + 1, this.j)];
        var bottom = grid[index(this.i, this.j + 1)];
        var left = grid[index(this.i - 1, this.j)];

        if (top && !top.visited) {
            neighbors.push(top);
        }
        if (right && !right.visited) {
            neighbors.push(right);
        }
        if (bottom && !bottom.visited) {
            neighbors.push(bottom);
        }
        if (left && !left.visited) {
            neighbors.push(left);
        }

        if (neighbors.length > 0) {
            var r = floor(random(0, neighbors.length));
            return neighbors[r];
        } else {
            return undefined;
        }
    }

    highlight() {
        var x = this.i*w;
        var y = this.j*w;
        noStroke();
        fill(0, 0, 255, 100);
        rect(x, y, w, w);
    }

    show() {
        var x = this.i * w;
        var y = this.j * w;
        stroke(255);

        if (this.walls[0]) {
            line(x, y, x + w, y); // top
        }
        if (this.walls[1]) {
            line(x + w, y, x + w, y + w); // right
        }
        if (this.walls[2]) {
            line(x + w, y + w, x, y + w); // bottom
        }
        if (this.walls[3]) {
            line(x, y + w, x, y); // left
        }

        if (this.visited) {
            noStroke(); // 
            fill(255, 0, 255, 100);
            rect(x, y, w, w);
        }
    }
}


function removeWalls(a, b) {
    var x = a.i - b.i;
    if ( x === 1) {
        a.walls[3] = false;
        b.walls[1] = false;
    } else if (x == -1) {
        a.walls[1] = false;
        b.walls[3] = false;
    }
    var y = a.j - b.j;
    if ( y === 1) {
        a.walls[0] = false;
        b.walls[2] = false;
    } else if (y == -1) {
        a.walls[2] = false;
        b.walls[0] = false;
    }
}
