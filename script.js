gsap.registerPlugin(MotionPathPlugin);

var xmlns = "http://www.w3.org/2000/svg",
  xlinkns = "http://www.w3.org/1999/xlink",
  select = function (s) {
    return document.querySelector(s);
  },
  selectAll = function (s) {
    return document.querySelectorAll(s);
  },
  pContainer = select(".pContainer"),
  mainSVG = select(".mainSVG"),
  star = select("#star"),
  sparkle = select(".sparkle"),
  tree = select("#tree"),
  showParticle = true,
  // === 修改：這裡換成了更漂亮的聖誕配色 (金、紅、綠、白) ===
  particleColorArray = [
    "#FFD700", // 金色
    "#FF0000", // 亮紅
    "#FFFFFF", // 雪白
    "#32CD32", // 萊姆綠
    "#FF69B4", // 亮粉紅 (增加一點活潑感)
    "#00FFFF", // 亮青色 (像霓虹燈)
    "#FF4500", // 橘紅
    "#ADFF2F"  // 黃綠
  ],
  particleTypeArray = ["#star", "#circ", "#cross", "#heart"],
  particlePool = [],
  particleCount = 0,
  numParticles = 201;

// --- 音樂與開始畫面控制 ---
var startOverlay = document.getElementById("startOverlay");
var bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.5; // 設定音量

startOverlay.addEventListener("click", function() {
  startOverlay.classList.add("fade-out");
  bgMusic.play().then(() => { 
    // 音樂開始播放
  }).catch(error => {
    console.log("Audio play failed:", error);
  });
 });
// -----------------------

gsap.set("svg", {
  visibility: "visible"
});

gsap.set(sparkle, {
  transformOrigin: "50% 50%",
  y: -100
});

function prepareDraw(el) {
    var length = el.getTotalLength();
    el.style.strokeDasharray = length;
    el.style.strokeDashoffset = length;
    return length;
}

let getSVGPoints = (path) => {
  let arr = [];
  var rawPath = MotionPathPlugin.getRawPath(path)[0];
  rawPath.forEach((el, value) =>  {
    let obj = {};
    obj.x = rawPath[value * 2];
    obj.y = rawPath[value * 2 + 1];
    if (value % 2) {
      arr.push(obj);
    }
  });
  return arr;
};

let treePath = getSVGPoints(".treePath");
var treeBottomPath = getSVGPoints(".treeBottomPath");

var mainTl = gsap.timeline({ delay: 0, repeat: 0 }),
  starTl;

function flicker(p) {
  gsap.killTweensOf(p, { opacity: true });
  gsap.fromTo(
    p,
    {
      opacity: 1
    },
    {
      duration: 0.07,
      opacity: Math.random(),
      repeat: -1
    }
  );
}

function createParticles() {
  var i = numParticles,
    p,
    step = numParticles / treePath.length,
    pos;
  while (--i > -1) {
    p = select(particleTypeArray[i % particleTypeArray.length]).cloneNode(true);
    mainSVG.appendChild(p);
    p.setAttribute("fill", particleColorArray[i % particleColorArray.length]);
    p.setAttribute("class", "particle");
    particlePool.push(p);
    gsap.set(p, {
      x: -100,
      y: -100,
      transformOrigin: "50% 50%"
    });
  }
}

var getScale = gsap.utils.random(0.5, 3, 0.001, true);

function playParticle(p) {
  if (!showParticle) {
    return;
  }
  var p = particlePool[particleCount];
  gsap.set(p, {
    x: gsap.getProperty(".pContainer", "x"),
    y: gsap.getProperty(".pContainer", "y"),
    scale: getScale()
  });
  
  var tl = gsap.timeline();
  
   var angle = gsap.utils.random(-180, 180) * (Math.PI / 180);
  var velocity = gsap.utils.random(20, 100); 
  var gravity = gsap.utils.random(10, 50); 
  
  var targetX = Math.cos(angle) * velocity;
  var targetY = Math.sin(angle) * velocity;
  var duration = gsap.utils.random(0.61, 2);

  tl.to(p, {
    duration: duration,
    x: "+=" + targetX,
    y: "+=" + (targetY + gravity),
    rotation: gsap.utils.random(-123, 360),
    scale: 0,
    ease: "power1.out",
    onStart: flicker,
    onStartParams: [p],
    onRepeat: (p) => {
      gsap.set(p, {
        scale: getScale()
      });
    },
    onRepeatParams: [p]
  });

  particleCount++;
  particleCount = particleCount >= numParticles ? 0 : particleCount;
}

function drawStar() {
  starTl = gsap.timeline({ onUpdate: playParticle });
  
   var treeBottomMaskPath = select(".treeBottomMaskPath");
  var treeBottomLen = prepareDraw(treeBottomMaskPath);

  starTl
    .to(".pContainer, .sparkle", {
      duration: 6,
      motionPath: {
        path: ".treePath",
        autoRotate: false
      },
      ease: "linear"
    })
    .to(".pContainer, .sparkle", {
      duration: 1,
      onStart: function () {
        showParticle = false;
      },
      x: treeBottomPath[0].x,
      y: treeBottomPath[0].y
    })
    .to(
      ".pContainer, .sparkle",
      {
        duration: 2,
        onStart: function () {
          showParticle = true;
        },
        motionPath: {
          path: ".treeBottomPath",
          autoRotate: false
        },
        ease: "linear"
      },
      "-=0"
    )
    .to(
      ".treeBottomMaskPath",
      {
        duration: 2,
        strokeDashoffset: 0,
        ease: "linear"
      },
      "-=2"
    );
}

function createSnow() {
  const snowSVG = select("#snowSVG");
  if (!snowSVG) return;

  const numSnowflakes = 100;

  for (let i = 0; i < numSnowflakes; i++) {
    let snowflake = document.createElementNS(xmlns, "circle");
    snowflake.setAttribute("r", gsap.utils.random(1, 3));
    snowflake.setAttribute("fill", "#FFFFFF");
    snowflake.setAttribute("opacity", gsap.utils.random(0.5, 0.9));
    snowSVG.appendChild(snowflake);

    gsap.set(snowflake, {
      x: gsap.utils.random(0, 800),
      y: gsap.utils.random(-100, -10),
    });

    gsap.to(snowflake, {
      y: 650,
      x: "+=" + gsap.utils.random(-50, 50),
      rotation: gsap.utils.random(0, 360),
      duration: gsap.utils.random(5, 15),
      delay: gsap.utils.random(0, 10),
      repeat: -1,
      ease: "none"
    });
  }
}

createParticles();
drawStar();
createSnow(); 

var treePathMaskPath = select(".treePathMaskPath");
var treePotMaskPath = select(".treePotMaskPath");
prepareDraw(treePathMaskPath);
prepareDraw(treePotMaskPath);

mainTl
  .to([treePathMaskPath, treePotMaskPath], {
    duration: 6,
    strokeDashoffset: 0, 
    stagger: {
      each: 6
    },
    duration: gsap.utils.wrap([6, 1, 2]),
    ease: "linear"
  })
  .from(
    ".treeStar",
    {
      duration: 3,
      scaleY: 0,
      scaleX: 0.15,
      transformOrigin: "50% 50%",
      ease: "elastic(1,0.5)"
    },
    "-=4"
  )
  .to(
    ".sparkle",
    {
      duration: 3,
      opacity: 0,
      ease:
        "rough({strength: 2, points: 100, template: linear, taper: both, randomize: true, clamp: false})"
    },
    "-=0"
  )
  .to(
    ".treeStarOutline",
    {
      duration: 1,
      opacity: 1,
      ease:
        "rough({strength: 2, points: 16, template: linear, taper: none, randomize: true, clamp: false})"
    },
    "+=1"
  );

mainTl.add(starTl, 0);
gsap.globalTimeline.timeScale(1.5);