// Maze Gneration using Recursive Backtracking Algorithm

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
    }

    show() {
        var x = this.i*w;
        var y = this.j*w;
        stroke(255);
        noFill();
        rect(x, y, w, w);
    }

}