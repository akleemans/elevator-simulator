/* -------- setup -------- */
let elevators: Array<Elevator>;
let queue: Array<Group>;
let canvas: any;
let ctx: any;
let tick: number;

const floors: number = 6;

// defined by user
let onCall: any;
let onEmpty: any;
//let getFloor: any;

enum GroupStatus {
    Waiting,
    Elevating,
    Arrived
}

function setup() {
    log("Starting up.");
    this.elevators = new Array<Elevator>();
    this.canvas = document.getElementById("drawCanvas");
    this.ctx = canvas.getContext("2d");
    this.tick = 0;

    // add elevators
    this.elevators.push(new Elevator(0));
    this.elevators.push(new Elevator(1));

    this.queue = new Array<Group>();

    for (let i = 0; i < 10; i++) {
        let from = getRandomInt(0, 6);
        let to = getRandomInt(0, 6);

        // when do they arrive?
        let arrivalTick = getRandomInt(0, 1000);

        // how many people?
        let size = 1;
        while (size < 10 && Math.random() < 0.3) {
            size += 1;
        }
        queue.push(new Group(i, size, from, to, arrivalTick));
    }

    console.log("Generated groups:", queue);
}

/* -------- main loop -------- */

function main(x: number) {
    if (onCall === undefined) {
        console.log("onCall() undefined!");
    }

    window.requestAnimationFrame(main);
    update();
    render();
    tick += 1;
    if (tick % 30 === 0) {
        console.log("tick", tick);
    }
}

function update() {
    // check if elevator arrived / group
    //for (let i = 0; i < elevators.length; i++) {
    //    elevators[i];
    //}

    // process queue
    for (let i = queue.length - 1; i >= 0; i--) {
        let g = queue[i];
        if (g.getArrivalTick() === tick) {
            // new group arriving
            console.log("New group of " + g.size + " arriving, from ", g.from, " to ", g.to);
            onCall(g.size, g.from, g.to);
        }

        // groups will enter if
        if (g.getArrivalTick() <= tick) {
            for (let j = 0; j < elevators.length; j++) {
                let e = elevators[j];
                // TODO check if elevator stopped / open, also if has capacity
                if (e.getFloor() === g.from) {
                    e.enter(g);
                    // remove group from queue
                    queue.splice(i, 1);
                }
            }

        }
    }

    // calculate changes
    for (let i = 0; i < elevators.length; i++) {
        elevators[i].move();
    }
}

function render() {
    // clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw floors
    drawBackground();

    // draw elevators
    for (let i = 0; i < elevators.length; i++) {
        drawElevator(elevators[i]);
    }
}

function drawElevator(elevator: Elevator) {
    //console.log("Drawing elevator:", elevator);
    let x = 50 + 100 * elevator.id;
    let y = 300 - elevator.position / 2;
    this.ctx.beginPath();
    this.ctx.rect(x, y, 30, 50);
    this.ctx.stroke();
}

function drawBackground() {
    ctx.font = "20px Arial";

    for (let floor = 0; floor < floors; floor++) {
        let y = 300 - (floor - 1) * 50;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(300, y);
        ctx.stroke();

        ctx.fillText(floor, 10, y);
    }
}

/* -------- functions -------- */

function log(s: string): void {
    let el = document.getElementById('log') as HTMLInputElement;
    //document.getElementById("log").innerHTML += '<br>' + s;
    el.innerHTML += '<br>' + s;
    console.log(s);
}

// returns a random integer between min (included) and max (excluded)
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

/* -------- classes -------- */

class Elevator {
    id: number;
    position: number;
    moving: boolean;
    currentGoal: number;
    destinations: Array<number>;
    velocity: number;
    capacity: number;
    groups: Array<Group>;

    constructor(id: number) {
        this.id = id;
        this.moving = false;
        this.currentGoal = 0;
        this.position = 0;
        this.groups = new Array<Group>();

        // adding some defaults for now
        this.velocity = 4;
        this.capacity = 10;
    }

    isBusy(): boolean {
        return this.moving;
    }

    enter(group: Group): boolean {
        // TODO maybe check capacity
        console.log("Group " + group.id + " is entering elevator " + this.id);
        this.groups.push(group);
        group.setStatus(GroupStatus.Elevating);
        return true;
    }

    releaseGroups() {
        // check if group
        for (let i = this.groups.length - 1; i >= 0; i--) {
            let g = this.groups[i];
            if (g.to == this.getFloor()) {
                console.log("Elevator " + this.id + " releases group" + g.id);
                g.setStatus(GroupStatus.Arrived);
                this.groups.splice(i, 1);
            }
        }
    }

    moveTo(floor: number) {
        if (this.moving || floor < 0 || floor > 5) {
            return;
        }
        this.moving = true;

        // calculate distance
        this.currentGoal = floor * 100;
    }

    move() {
        // if goal was reached, stop
        if (this.position === this.currentGoal) {
            // check if just arrived
            if (this.moving) {
                this.releaseGroups();
                this.moving = false;
            }
            return;
        } else {
            // set direction to move
            let direction = 1;
            if (this.currentGoal < this.position) {
                direction = -1;
            }
            this.position += direction * this.velocity;
        }
    }

    setFloor(floor: number) {
        this.position = floor * 100;
    }

    getFloor(): number {
        return this.position / 100;
    }
}


class Group {
    id: number;
    size: number;
    from: number;
    to: number;
    arrivalTick: number;
    status: GroupStatus;

    constructor(id: number, size: number, from: number, to: number, arrivalTick: number) {
        this.id = id;
        this.size = size;
        this.from = from;
        this.to = to;
        this.arrivalTick = arrivalTick;

        this.status = GroupStatus.Waiting; // waiting
    }

    getArrivalTick(): number {
        return this.arrivalTick;
    }

    setStatus(status: GroupStatus) {
        this.status = status;
    }
}

/* -------- buttons -------- */

function run() {
    let el = document.getElementById('code') as HTMLInputElement;
    let scriptText = el.value;
    let oldScript = document.getElementById('scriptContainer');
    let newScript;

    if (oldScript) {
        oldScript.parentNode.removeChild(oldScript);
    }

    newScript = document.createElement('script');
    newScript.id = 'scriptContainer';
    newScript.text = el.value;
    document.body.appendChild(newScript);

    // start game loop
    main(0);
}

/* -------- setup -------- */

document.addEventListener("DOMContentLoaded", function (event) {
    setup();
});
