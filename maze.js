// Maze Gneration using Recursive Backtracking Algorithm
// Bunch of cell in a grid having four lines : top, right, bottom, left.
var cols, rows;
var w = 40; // width
var grid = []; // 1D array

function setup() {
    createCanvas(400, 400);
    cols = floor(width/w);
    rows = floor(height/w);

    for ( var j = 0; j < rows; j++) {
        for( var i = 0; i < cols; i++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }
}

function draw() {
    background(51);
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }
}

class Cell {
    constructor(i, j) {
        this.i = i; // Column number
        this.j = j; // Row number
        this.walls = [true, true, true, true];
;    }

    show() {
        var x = this.i*w;
        var y = this.j*w;
        stroke(255);
        
        if (this.walls[0]) {
            line(x, y, x+w, y); // top
        }
        if (this.walls[1]) {
            line(x+w, y, x+w, y+w); // right
        }
        if (this.walls[2]) {
            line(x+w, y+w, x, y+w); // bottom
        }
        if (this.walls[3]) {
            line(x, y+w, x, y); // left
        }
        // noFill();
        // rect(x, y, w, w);
    }

}