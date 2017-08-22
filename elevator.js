/* -------- setup -------- */
var elevators;
var queue;
var canvas;
var ctx;
var tick;
// defined by user
var onCall;
var onEmpty;
//let getFloor: any;
var GroupStatus;
(function (GroupStatus) {
    GroupStatus[GroupStatus["Waiting"] = 0] = "Waiting";
    GroupStatus[GroupStatus["Elevating"] = 1] = "Elevating";
    GroupStatus[GroupStatus["Arrived"] = 2] = "Arrived";
})(GroupStatus || (GroupStatus = {}));
function setup() {
    log("Starting up.");
    this.elevators = new Array();
    this.canvas = document.getElementById("drawCanvas");
    this.ctx = canvas.getContext("2d");
    this.tick = 0;
    // add elevators
    this.elevators.push(new Elevator(0));
    this.elevators.push(new Elevator(1));
    // some initial positions / movement
    //this.elevators[0].moveTo(3);
    //this.elevators[1].setPosition(2);
    this.queue = new Array();
    for (var i = 0; i < 10; i++) {
        var from = getRandomInt(0, 6);
        var to = getRandomInt(0, 6);
        // when do they arrive?
        var arrivalTick = getRandomInt(0, 1000);
        // how many people?
        var size = 1;
        while (size < 10 && Math.random() < 0.3) {
            size += 1;
        }
        queue.push(new Group(i, size, from, to, arrivalTick));
    }
    console.log("Generated groups:", queue);
}
/* -------- main loop -------- */
function main(x) {
    if (onCall === undefined) {
        console.log("onCall() undefined!");
    }
    window.requestAnimationFrame(main);
    //console.log('Im in yr loop...', x);
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
    for (var i = queue.length - 1; i >= 0; i--) {
        var g = queue[i];
        if (g.getArrivalTick() === tick) {
            // new group arriving
            console.log("New group of " + g.size + " arriving, from ", g.from, " to ", g.to);
            onCall(g.size, g.from, g.to);
        }
        // groups will enter if
        if (g.getArrivalTick() <= tick) {
            for (var j = 0; j < elevators.length; j++) {
                var e = elevators[j];
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
    for (var i = 0; i < elevators.length; i++) {
        elevators[i].move();
    }
}
function render() {
    // clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0; i < elevators.length; i++) {
        drawElevator(elevators[i]);
        // TODO draw_elevator(elevators.get(i))
    }
}
function drawElevator(elevator) {
    //console.log("Drawing elevator:", elevator);
    var x = 50 + 100 * elevator.id;
    var y = 300 - elevator.position / 2;
    this.ctx.beginPath();
    this.ctx.rect(x, y, 30, 50);
    this.ctx.stroke();
}
/* -------- functions -------- */
function log(s) {
    var el = document.getElementById('log');
    //document.getElementById("log").innerHTML += '<br>' + s;
    el.innerHTML += '<br>' + s;
    console.log(s);
}
// returns a random integer between min (included) and max (excluded)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
/* -------- classes -------- */
var Elevator = (function () {
    function Elevator(id) {
        this.id = id;
        this.moving = false;
        this.currentGoal = 0;
        this.position = 0;
        this.groups = new Array();
        // adding some defaults for now
        this.velocity = 4;
        this.capacity = 10;
    }
    Elevator.prototype.isBusy = function () {
        return this.moving;
    };
    Elevator.prototype.enter = function (group) {
        // TODO maybe check capacity
        console.log("Group " + group.id + " is entering elevator " + this.id);
        this.groups.push(group);
        group.setStatus(GroupStatus.Elevating);
        return true;
    };
    Elevator.prototype.releaseGroups = function () {
        // check if group
        for (var i = this.groups.length - 1; i >= 0; i--) {
            var g = this.groups[i];
            if (g.to == this.getFloor()) {
                console.log("Elevator " + this.id + " releases group" + g.id);
                g.setStatus(GroupStatus.Arrived);
                this.groups.splice(i, 1);
            }
        }
    };
    Elevator.prototype.moveTo = function (floor) {
        if (this.moving || floor < 0 || floor > 5) {
            return;
        }
        this.moving = true;
        // calculate distance
        this.currentGoal = floor * 100;
    };
    Elevator.prototype.move = function () {
        // if goal was reached, stop
        if (this.position === this.currentGoal) {
            // check if just arrived
            if (this.moving) {
                this.releaseGroups();
                this.moving = false;
            }
            return;
        }
        else {
            // set direction to move
            var direction = 1;
            if (this.currentGoal < this.position) {
                direction = -1;
            }
            this.position += direction * this.velocity;
        }
    };
    Elevator.prototype.setFloor = function (floor) {
        this.position = floor * 100;
    };
    Elevator.prototype.getFloor = function () {
        return this.position / 100;
    };
    return Elevator;
}());
var Group = (function () {
    function Group(id, size, from, to, arrivalTick) {
        this.id = id;
        this.size = size;
        this.from = from;
        this.to = to;
        this.arrivalTick = arrivalTick;
        this.status = GroupStatus.Waiting; // waiting
    }
    Group.prototype.getArrivalTick = function () {
        return this.arrivalTick;
    };
    Group.prototype.setStatus = function (status) {
        this.status = status;
    };
    return Group;
}());
/* -------- buttons -------- */
function run() {
    var el = document.getElementById('code');
    var scriptText = el.value;
    var oldScript = document.getElementById('scriptContainer');
    var newScript;
    if (oldScript) {
        oldScript.parentNode.removeChild(oldScript);
    }
    newScript = document.createElement('script');
    newScript.id = 'scriptContainer';
    newScript.text = el.value;
    document.body.appendChild(newScript);
    // start game loop
    main();
}
/* -------- setup -------- */
document.addEventListener("DOMContentLoaded", function (event) {
    setup();
});
