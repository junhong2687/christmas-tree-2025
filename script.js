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
  particleColorArray = [
    "#E8F6F8",
    "#ACE8F8",
    "#F6FBFE",
    "#A2CBDC",
    "#B74551",
    "#5DBA72",
    "#910B28",
    "#910B28",
    "#446D39"
  ],
  particleTypeArray = ["#star", "#circ", "#cross", "#heart"],
  particlePool = [],
  particleCount = 0,
  numParticles = 201;

// --- 音樂與開始畫面控制 ---
var startOverlay = document.getElementById("startOverlay");
var bgMusic = document.getElementById("bgMusic");

startOverlay.addEventListener("click", function() {
  startOverlay.classList.add("fade-out");
  // 播放音樂
  bgMusic.play().then(() => {
    // 音樂開始播放
  }).catch(error => {
    console.log("Audio play failed:", error);
  });
  
  // 啟動主動畫 (原本是直接跑，現在為了體驗好一點，可以考慮這裡再開始，或者保持原樣)
  // 如果想點擊後動畫才開始，可以把最後一行改到這裡。
});
// -----------------------

gsap.set("svg", {
  visibility: "visible"
});

gsap.set(sparkle, {
  transformOrigin: "50% 50%",
  y: -100
});

// 替代 DrawSVG 的輔助函數
function prepareDraw(el) {
    var length = el.getTotalLength();
    el.style.strokeDasharray = length;
    el.style.strokeDashoffset = length;
    return length;
}

let getSVGPoints = (path) => {
  let arr = [];
  var rawPath = MotionPathPlugin.getRawPath(path)[0];
  // MotionPathPlugin 在沒有 MorphSVG 的情況下對於簡單路徑仍然有效
  rawPath.forEach((el, value) => {
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

// 替代 Physics2D 的粒子動畫
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
  
  // 模擬物理效果：隨機角度飛出
  var angle = gsap.utils.random(-180, 180) * (Math.PI / 180);
  var velocity = gsap.utils.random(20, 100); // 隨機距離
  var gravity = gsap.utils.random(10, 50);   // 模擬重力下墜
  
  var targetX = Math.cos(angle) * velocity;
  var targetY = Math.sin(angle) * velocity;
  var duration = gsap.utils.random(0.61, 2);

  tl.to(p, {
    duration: duration,
    x: "+=" + targetX,
    y: "+=" + (targetY + gravity), // 加上 Y 軸偏移模擬重力
    rotation: gsap.utils.random(-123, 360),
    scale: 0,
    ease: "power1.out", // 簡單的緩動
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
  
  // 設定樹底部 Mask 的初始狀態 (模擬 DrawSVG)
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
        strokeDashoffset: 0, // 模擬 drawSVG: "0% 0%" -> "0% 100%"
        ease: "linear"
      },
      "-=2"
    );
}

createParticles();
drawStar();

// 準備其他路徑的 DrawSVG 替代
var treePathMaskPath = select(".treePathMaskPath");
var treePotMaskPath = select(".treePotMaskPath");
prepareDraw(treePathMaskPath);
prepareDraw(treePotMaskPath);

mainTl
  .to([treePathMaskPath, treePotMaskPath], {
    duration: 6,
    strokeDashoffset: 0, // 畫出線條
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