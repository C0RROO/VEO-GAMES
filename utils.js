// Utility Functions

// Calculate distance between two points in 3D space
function distance3D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Calculate distance between two points in 2D (XZ plane)
function distance2D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

// Generate random position around a center point
function randomPositionAround(center, minRadius, maxRadius) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    return {
        x: center.x + Math.cos(angle) * radius,
        z: center.z + Math.sin(angle) * radius
    };
}

// Check if two spheres collide
function checkCollision(pos1, radius1, pos2, radius2) {
    return distance2D(pos1, pos2) < (radius1 + radius2);
}

// Normalize a 2D vector
function normalize2D(x, z) {
    const length = Math.sqrt(x * x + z * z);
    if (length === 0) return { x: 0, z: 0 };
    return {
        x: x / length,
        z: z / length
    };
}

// Lerp (Linear Interpolation)
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Convert world position to screen position
function worldToScreen(position, camera, canvas) {
    const vector = position.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * canvas.width;
    const y = (-(vector.y * 0.5) + 0.5) * canvas.height;
    
    return { x, y };
}

// Create a random color
function randomColor() {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
}

// HSL to RGB color
function hslToRgb(h, s, l) {
    const color = new THREE.Color();
    color.setHSL(h, s, l);
    return color;
}
