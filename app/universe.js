import Matter    from 'matter-js';
import { fetch, createDOM } from 'util/helpers';
import _         from 'lodash';

/**
 * Base configuration
 */
let game = {
  lastTimeStamp: 0,
  gravity: 0.001,
  width: Math.min(document.documentElement.clientWidth),
  height: Math.min(document.documentElement.clientHeight),
  backgroundColor: "transparent"
};

/**
 * Matter shortcuts
 */
let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events,
    Mouse = Matter.Mouse,
    Vertices = Matter.Vertices,
    Svg = Matter.Svg,
    MouseConstraint = Matter.MouseConstraint;

const engine = Engine.create(),
      world = engine.world;

let materials = [];
let player;

engine.velocityIterations = 4;
engine.positionIterations = 6;
engine.world.gravity.y = 0;
engine.timing.timeScale = 0.5;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width: game.width,
    height: game.height,
    showVelocity: true,
    wireframeBackground: game.backgroundColor,
    background: game.backgroundColor
  }
});

Render.run(render);

var runner = Runner.create();
Runner.run(runner, engine);

/**
 * Add mouse control to canvas and objects.
 */
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});
World.add(world, mouseConstraint);

let canvas = document.getElementsByTagName("canvas")[0];
let ctx = canvas.getContext("2d"); 

 //looks for key presses and logs them
var keys = [];
document.body.addEventListener("keydown", function(e) {
  keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
  keys[e.keyCode] = false;
});

/**
 * Apply gravity by stepping through the materials (any Body affected by gravity) and applying force to one another.
 * https://codepen.io/lilgreenland/pen/pbyprV
 * @returns {nil} Nil
 */
function gravity() {
  var length = materials.length
  for (var i = 0; i < length; i++) {
    for (var j = 0; j < length; j++) {
      if (i !== j) {
        var Dx = materials[j].position.x - materials[i].position.x;
        var Dy = materials[j].position.y - materials[i].position.y;
        var force = (engine.timing.timestamp-game.lastTimeStamp)*game.gravity * materials[j].mass * materials[i].mass / (Math.sqrt(Dx * Dx + Dy * Dy))
        var angle = Math.atan2(Dy, Dx);
        materials[i].force.x += force * Math.cos(angle);
        materials[i].force.y += force * Math.sin(angle);
      }
    }
  }
  game.lastTimeStamp = engine.timing.timestamp;
}

/**
 * 
 * @param {string} name Name of the planet
 * @param {object} options Options to change the default configuration.
 * @return {object} Return the Matter.Bodies object.
 */
export function Planet(name, options = {}) {
  const defaults = {
    x: 200,
    y: 200,
    r: 100,
    vx: 0,
    vy: 0,
    body: {
      isStatic: false,
      friction: 0,
      frictionStatic: 1,
      frictionAir: 0,
      restitution: 0.2,
      velocityVector: true,
      mass: 1,
      render: { fillStyle: '#fff'}
    }
  };

  const config = _.merge({}, defaults, options);

  const body = Bodies.circle(config.x, config.y, config.r, config.body);
  body.label = name;
  World.add(world, body);

  materials.push(body);

  Body.setVelocity(body, { 
    x: config.vx, 
    y: config.vy
  });

  return body;
}

/**
 * A ship to roam the galaxies.
 * @returns {nil} Nil
 */
function Ship() {
  // Get the SVG Shape
  fetch('rocket.svg', (data) => {
    let vertexSets = [];

    // Get paths
    let svgPath = createDOM(data).getElementsByTagName("path");

    // Added to ES6 is Array.from() that will convert an array-like structure to an actual array.
    // That allows one to enumerate a list directly
    Array.from(svgPath).forEach((path) => {
      var points = Svg.pathToVertices(path, 3);
      vertexSets.push(Vertices.scale(points, 1, 1));
    });

    player = Bodies.fromVertices(200, 200, vertexSets, {
      mass: 0.1,
      force: {
        x: 0,
        y: 0
      },
      thrust: 0.0004, //forward acceleration, if mass goes up this needs to go up
      yaw: 0.01800, //angular acceleration, needs to be higher with  larger mass
      rotationLimit: 0.05, //max acceleration for player in radians/cycle
      angularFriction: 0.98, // 1 = no friction,  0.9 = high friction,
      angularVelocity: 0,
      render: {
        fillStyle: '#96281B'
      }
    });

    World.add(world, player, true);
  });
}

function shipControls() {
  let ship = player;
  if(typeof ship !== 'undefined') {
    let reverseThrust = (keys[38] || keys[87]);
    let forwardThrust = (keys[40] || keys[83]);

    if (forwardThrust) {
      ship.force.x += ship.thrust * Math.cos(ship.angle + Math.PI * 0.5);
      ship.force.y += ship.thrust * Math.sin(ship.angle + Math.PI * 0.5);
      thrustGraphic();
    } else if (reverseThrust) {
      ship.force = {
        x: -ship.thrust * 0.5 * Math.cos(ship.angle + Math.PI * 0.5),
        y: -ship.thrust * 0.5 * Math.sin(ship.angle + Math.PI * 0.5)
      };
      torqueGraphic(-1);
      torqueGraphic(1);
    }
    //rotate left and right
    if ((keys[37] || keys[65])) { //&& ship.angularVelocity > -ship.rotationLimit) {
      ship.torque = -ship.yaw; //counter clockwise
      torqueGraphic(-1);
    } else if ((keys[39] || keys[68])) { //&& ship.angularVelocity < ship.rotationLimit) {
      ship.torque = ship.yaw; //clockwise
      torqueGraphic(1);
    }
    //angular friction if spinning too fast
    if (Math.abs(ship.angularVelocity) > ship.rotationLimit) {
      Matter.Body.setAngularVelocity(ship, ship.angularVelocity * ship.angularFriction);
    }
  }
}

function torqueGraphic(dir) { //thrust graphic when holding rotation keys
    ctx.save();
    //ctx.translate(0.5 * canvas.width, 0.5 * canvas.height)
    ctx.rotate(player.angle - Math.PI * 0.6 * dir);
    ctx.translate(0, -23);
    var grd = ctx.createLinearGradient(0, 0, 0, 15);
    grd.addColorStop(0.1, 'rgba(0, 0, 0, 0)');
    grd.addColorStop(1, 'rgba(160, 192, 255, 1)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(dir * 6 * (Math.random() - 0.5) + 12 * dir, 6 * (Math.random() - 0.5));
    ctx.lineTo(dir * 8, 14);
    ctx.lineTo(dir * 12, 14);
    ctx.fill();
    ctx.restore();
  }

  function thrustGraphic() {
    //ctx.fillStyle= "#90b0ff";
    ctx.save();
    //ctx.translate(0.5 * canvas.width, 0.5 * canvas.height)
    ctx.rotate(player.angle);
    ctx.translate(0, -33);
    var grd = ctx.createLinearGradient(0, 0, 0, 15);
    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grd.addColorStop(1, 'rgba(160, 192, 255, 1)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5));
    ctx.lineTo(7, 20);
    ctx.lineTo(-7, 20);
    ctx.fill();
    ctx.restore();
  }

/**
 * Setup the whole universe.
 * @returns {nil} Nil
 */
export function Universe() {
  new Planet('earth', {
    x: game.width / 2,
    y: game.height / 2,
    r: 100,
    body: {
      mass: 15,
      isStatic: true,
      render: { fillStyle: '#3D8EB9'}
    }
  });

  new Planet('moon', {
    x: 200,
    y: 200,
    r: 30,
    vx: -4,
    vy: 5,
    body: {
      mass: 0.2,
      render: { fillStyle: '#BDC3C7'}
    }
  });

  new Ship();

  Events.on(engine, "beforeTick", () => {
    gravity();
    shipControls();
  });
}