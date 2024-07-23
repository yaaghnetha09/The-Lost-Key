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
    var next = current.check_neighbors();
    if (next) {
        next.visited = true;
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
            fill(255, 0, 255, 100);
            rect(x, y, w, w);
        }
    }
}
