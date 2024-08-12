export function createCity(size) {
    const data = [];

    function initialize() {
        for (let x = 0; x < size; x++) {
            const column = [];
            for (let y = 0; y < size; y++) {
                const buildingChance = Math.random();
                let building = undefined;
                if (buildingChance < 0.4) { 
                    const height = Math.floor(Math.random() * 3) + 1;
                    building = `building-${height}`;
                }
                const tile = { 
                    x, 
                    y, 
                    building
                };
                column.push(tile);
            }
            data.push(column);
        }
    }

    function update() {
        // Update logic for city, if needed
    }

    initialize();

    return { size, data, update };
}
