/*
AI generative arts project
Final Project for Making Decisions with AI

Author: Minh Pham
Date: 24 Nov 2021
*/

/*-------------- CONSTANTS --------------*/
const B = 20; // border length
const X = 300; // canvas horizontal size
const Y = 500; // canvas vertical size
const S = 10; // step size between two vertical lines
const H = getRandomInt(7,21) // number of horizontal lines
const V = X/S + 1; // number of vertical lines

const p = new Array(V); // a 2d array of points sorted along the y-axis
const itersDraw = 300; // number of screens, which span the full horizontal length
const sy = H; // screen vertical length
const maxTimeDraw = 300; // max time for simulated annealing

let c = []; // array of colors for the H+1 regions
const colorScheme = Math.random(); // color scheme
const maxTimePaint = 30;

console.log("starting");

/*-------------- DRAWING --------------*/
function getEnergyDraw(arr) {
	let energy = 0;
	let numCurves = 0;
	for (let x = 1; x < arr.length-1; x++) {
		energy += Math.abs(arr[x+1][0] - 2*arr[x][0] + arr[x-1][0]);
		if ((arr[x+1][0] - arr[x][0])*(arr[x][0] - arr[x-1][0]) < 0) {
			numCurves++;
		}
	}
	energy += Math.pow(numCurves, 2);
	for (let y = 1; y < arr[0].length; y++) {
		numCurves = 0;
		for (let x = 1; x < arr.length-1; x++) {
			// penalizes if there are too many hills
			if ((arr[x+1][y] - arr[x][y])*(arr[x][y] - arr[x-1][y]) < 0) {
				numCurves++;
			}
			// penalizes if two adjacent steps don't look next to each other
			energy += Math.abs(arr[x+1][y] - 2*arr[x][y] + arr[x-1][y]);

			// penalizes if two adjecent lines go in opposite directions
			energy += (-((arr[x][y]-arr[x-1][y])*(arr[x][y-1]-arr[x-1][y-1]) >= 0)+1);
		}
		energy += Math.pow(numCurves, 2);
	}
	return energy
}

function getNeighborDraw(arr) {
	var nextArr = JSON.parse(JSON.stringify(arr));
	let x = getRandomInt(0, arr.length);
	let y = getRandomInt(1, arr[0].length-1);
	let dnorth = Math.abs(arr[x][y-1] - arr[x][y]);
	let dsouth = Math.abs(arr[x][y+1] - arr[x][y]);
	nextArr[x][y] = arr[x][y] + getRandom(-dnorth/2, dsouth/2);
	return nextArr;
}

// Initial State
for (let x = 0; x < V; x++) {
	pv = new Array(H);
	for (let y = 0; y < H; y++) {
		pv[y] = getRandom(0, Y);
	}
	pv.push(0);
	pv.push(Y);
	p[x] = pv.sort((a, b) => a - b);
}

// Simulated Annealing for Drawing
// iteratively do simulated annealing on different screens of size sy*V
let ix0 = 0, ix1 = V;
let arr = new Array(sy);
for (let j = 0; j < itersDraw; j++) {
	// Obtains the screen and stores in arr
	let iy0 = getRandomInt(0, p[0].length-sy+1);
	let iy1 = iy0 + sy;
	for (let x = ix0; x < ix1; x++) {
		for (let y = iy0; y < iy1; y++) {
			arr[x-ix0] = p[x].slice(iy0, iy1);
		}
	}
	let t = 1;
	while (t < maxTimeDraw) {
		let nextArr = getNeighborDraw(arr);
		let energyChange = getEnergyDraw(arr) - getEnergyDraw(nextArr);
		if (energyChange > 0) {
			arr = nextArr;
		} else if (Math.random() < Math.exp(0.05*energyChange*t)) {
			arr = nextArr;
		}
		t++;
	}
	// update the list of points
	for (let x = ix0; x < ix1; x++) {
		for (let y = iy0; y < iy1; y++) {
			p[x][y] = arr[x-ix0][y-iy0];
		}
	}
}


/*-------------- COLORING --------------*/
function findColor(rgb) {
	// takes in an array of 3 things [r,g,b]
	if (colorScheme < 0.3) { // charcoal
		let curr = rgb[0];
		if (Math.random() > 0.6) {
			curr = curr+[-1,1][getRandomInt(0,2)]*getRandomInt(7,14);
		} else {
			curr = 255-curr;
		}
		curr = Math.max(Math.min(curr,255), 0);
		return new Array(3).fill(curr);
	} else { // any colors
		if (Math.random() > 0.5) {
			for (let i = 0; i < 3; i++) {
			  let c = rgb[i]+[-1,1][getRandomInt(0,2)]*getRandomInt(7,14);
			  rgb[i] = Math.max(Math.min(c,255), 0);
			}
		} else {
			for (let i = 0; i < 3; i++) {
			  let c = 255-rgb[i];
			  rgb[i] = Math.max(Math.min(c,255), 0);
			}
		}
		return rgb;
	}
}

function getWeakness(arr) {
	let weakness = 0;

	// penalizes if there's little balance of colors between top half and bottom half
	let total1 = 0;
	let total2 = 0;
	for (let i = 0; i < Math.floor((H+1)/2); i++) {
		total1 += arr[i][0] + arr[i][1] + arr[i][2];
	}
	for (let i = H; i >= Math.ceil((H+1)/2); i--) {
		total2 += arr[i][0] + arr[i][1] + arr[i][2];
	}
	weakness += Math.abs(total1-total2);

	// penalizes if non-related colors are adjacent
	for (let i = 1; i < arr.length; i++) {
		let m = (arr[i][0] + arr[i][1] + arr[i][2] + arr[i-1][0] + arr[i-1][1] + arr[i-1][2]);
		let n = (arr[i][0] + arr[i][1] + arr[i][2] - arr[i-1][0] - arr[i-1][1] - arr[i-1][2]);
		if (m > 255*3 + 40 || m < 255*3 - 40 || n > 40 || n < -40) {
			weakness += 30;
		}
	}
	return weakness;
}

function mutate() {
	var cnew = JSON.parse(JSON.stringify(c));
	// creates neutral color, which is the frame color
	if (Math.random() < 0.3) {
		cnew[getRandomInt(0,cnew.length)] = [243,240,220];
	}
	// swaps two random colors
	let i1 = getRandomInt(0, H+1);
	let i2 = getRandomInt(0, H+1);
	cnew[i1] = c[i2];
	cnew[i2] = c[i1];
	return cnew;
}

// Initial State
if (colorScheme < 0.3) { // charcoal
	c[0] = Array(3).fill(getRandomInt(0,255));	
} else {
	c[0] = Array.from({length: 3}, () => getRandomInt(0,255));
}
for (let y = 0; y < H; y++) {
	if (Math.random() < 0.15) {
		if (colorScheme < 0.3) {
			c.push(Array(3).fill(getRandomInt(0,255)));
		} else {
			c.push(Array.from({length: 3}, () => getRandomInt(0,255)));
		}
	} else {
		c.push(findColor(c[y].slice()));
	}
}

// Genetic Algorithm for Local Search
let tt = 1;
while (tt < maxTimePaint) {
	let cnew = mutate();
	let weaknessChange = getWeakness(c) - getWeakness(cnew);
	if (weaknessChange > 0) {
		c = cnew;
	} else if (Math.random() < Math.exp(weaknessChange*1)) {
		c = cnew;
	}
	tt++;
}


function draw() {
	background(243,240,220);
	noStroke();
	rect(B,B,X,Y);
	for (let y = 1; y < H+2; y++) {
		fill(c[y-1]);
		for (let x = 1; x < V; x++) {
			beginShape();
			vertex(getx(x-1), gety(p[x-1][y-1]));
			vertex(getx(x), gety(p[x][y-1]));
			vertex(getx(x), gety(p[x][y]));
			vertex(getx(x-1), gety(p[x-1][y]));
			endShape(CLOSE);
		}
	}
	createTexture();
	console.log("finished drawing!")
}


/*-------------- MISCELLANEOUS --------------*/
function getRandom(min, max) {
	return Math.random() * (max - min) + min; 
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); 
}

function getx(x) {
	return B + S*x;
}

function gety(y) {
	return B + y;
}

function setup() {
	createCanvas(X+2*B, Y+2*B);
	noLoop();
}

function createTexture() {
	let e = 0;
	let numFibers = 100000;
	let deltax = getRandom(0.4, 1);
	let deltay = [-1,1][getRandomInt(0,2)]*getRandom(0.7, 3);
	for (let i=0; i<numFibers; i++) {
		let x = random() * (X+2*B);
		let y = random() * (Y+2*B);
		strokeWeight(getRandom(0,0.2));
		stroke(getRandomInt(200,260));
		e = getRandom(-0.3,0.3);
		line(x+e, y+e, x+deltax+e, y+deltay+e);
	}
}
