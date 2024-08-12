// minimap.js
export class MiniMap {
    constructor(width, height, blockSize = { width: 10, height: 10, blockSize: 2 }) {
        this.width = width;
        this.height = height;
        this.blockSize = blockSize;

        this.playerPosition = { x: 0, y: 0 };

        // Create the canvas element
        this.miniMap = document.createElement("canvas");
        this.ctx = this.miniMap.getContext("2d");

        // Set canvas size and style
        this.miniMap.width = this.width * this.blockSize.width;
        this.miniMap.height = this.height * this.blockSize.height;
        this.miniMap.style.position = "absolute";
        this.miniMap.style.top = "10px";
        this.miniMap.style.left = "10px";
        this.miniMap.style.border = "1px solid black";

        // Append the canvas to the document body
        document.body.appendChild(this.miniMap);
    }

    
    // Draw the maze layout based on mazeData
drawMaze(mazeData) {
    mazeData.forEach(cell => {
        const { i, j, walls } = cell;

        // Draw walls for the cell
        // walls[0] -> top, walls[1] -> right, walls[2] -> bottom, walls[3] -> left
        if (walls[0]) { // Top wall
            this.drawWall(i, j, 'top');
        }
        if (walls[1]) { // Right wall
            this.drawWall(i, j, 'right');
        }
        if (walls[2]) { // Bottom wall
            this.drawWall(i, j, 'bottom');
        }
        if (walls[3]) { // Left wall
            this.drawWall(i, j, 'left');
        }
    });
}

// Function to draw specific walls on the minimap
drawWall(i, j, direction) {
    this.ctx.strokeStyle = "rgb(200, 200, 200)"; // Wall color
    this.ctx.lineWidth = 2; // Wall thickness

    const x = i * this.blockSize.width;
    const y = j * this.blockSize.height;

    this.ctx.beginPath();
    switch (direction) {
        case 'top':
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + this.blockSize.width, y);
            break;
        case 'right':
            this.ctx.moveTo(x + this.blockSize.width, y);
            this.ctx.lineTo(x + this.blockSize.width, y + this.blockSize.height);
            break;
        case 'bottom':
            this.ctx.moveTo(x, y + this.blockSize.height);
            this.ctx.lineTo(x + this.blockSize.width, y + this.blockSize.height);
            break;
        case 'left':
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + this.blockSize.height);
            break;
    }
    this.ctx.stroke();
}


    // Update the player's position on the minimap
    update(playerPosition) {
        // Clear previous player position (make it transparent)
    this.ctx.clearRect(this.playerPosition.x * this.blockSize.width, this.playerPosition.y * this.blockSize.height, this.blockSize.width, this.blockSize.height);

        // Draw new player position
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(playerPosition.x * this.blockSize.width, playerPosition.y * this.blockSize.height, this.blockSize.width, this.blockSize.height);

        this.playerPosition = playerPosition;
    }
}
