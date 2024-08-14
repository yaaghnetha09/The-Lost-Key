export class MiniMap {
    constructor(width, height, blockSize = { width: 18, height: 18 }) {
        this.width = width;
        this.height = height;
        this.blockSize = blockSize;

        this.playerPosition = { x: 0, y: 0 };
        this.endPosition = null;

        // Create the canvas element
        this.miniMap = document.createElement("canvas");
        this.ctx = this.miniMap.getContext("2d");

        // Set canvas size and style
        this.miniMap.width = this.width * this.blockSize.width;
        this.miniMap.height = this.height * this.blockSize.height;
        this.miniMap.style.position = "absolute";
        this.miniMap.style.top = "15px";
        this.miniMap.style.left = "10px";
        this.miniMap.style.border = "6px solid black";

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.miniMap.width, this.miniMap.height);

        document.body.appendChild(this.miniMap);
    }

    drawMaze(mazeData) {
        mazeData.forEach(cell => {
            const { i, j, walls } = cell;

            if (walls[0]) {
                this.drawWall(i, j, 'top');
            }
            if (walls[1]) {
                this.drawWall(i, j, 'right');
            }
            if (walls[2]) {
                this.drawWall(i, j, 'bottom');
            }
            if (walls[3]) {
                this.drawWall(i, j, 'left');
            }
        });
    }

    drawWall(i, j, direction) {
        this.ctx.strokeStyle = 'black'; // Wall color
        this.ctx.lineWidth = 5; // Wall thickness

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

    setEndPosition(endPosition) {
        this.endPosition = endPosition;

        this.ctx.fillStyle = "green";
        const markerSize = 13;
        this.ctx.fillRect(
            this.endPosition.x * this.blockSize.width + (this.blockSize.width - markerSize) / 2,
            this.endPosition.y * this.blockSize.height + (this.blockSize.height - markerSize) / 2,
            markerSize,
            markerSize
        );
    }

    update(playerPosition) {
        const playerMarkerSize = { width: 10, height: 10 };

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(
            this.playerPosition.x * this.blockSize.width + (this.blockSize.width - playerMarkerSize.width) / 2,
            this.playerPosition.y * this.blockSize.height + (this.blockSize.height - playerMarkerSize.height) / 2,
            playerMarkerSize.width,
            playerMarkerSize.height
        );

        if (this.endPosition) {
            this.ctx.fillStyle = "green";
            this.ctx.fillRect(
                this.endPosition.x * this.blockSize.width + (this.blockSize.width - playerMarkerSize.width) / 2,
                this.endPosition.y * this.blockSize.height + (this.blockSize.height - playerMarkerSize.height) / 2,
                playerMarkerSize.width,
                playerMarkerSize.height
            );
        }

        this.ctx.fillStyle = "red";
        this.ctx.fillRect(
            playerPosition.x * this.blockSize.width + (this.blockSize.width - playerMarkerSize.width) / 2,
            playerPosition.y * this.blockSize.height + (this.blockSize.height - playerMarkerSize.height) / 2,
            playerMarkerSize.width,
            playerMarkerSize.height
        );

        this.playerPosition = playerPosition;
    }
}
