javascript:(()=>{
  const fastRate = 10.0;
  const normalRate = 1.0;
  const threshold = 5.0;
  const hideDelayMs = 3000;
  const loadingTimeoutMs = 5000; 

  const video = Array.from(document.querySelectorAll("video"))
    .find(v => v.className.includes("videoInner_") && v.poster && v.poster.includes("quests"));
  if(!video) return;

  let overlay = document.getElementById("bookmarklet-speed-overlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "bookmarklet-speed-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      bottom: "10px",
      right: "10px",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      fontSize: "13px",
      padding: "6px 10px",
      borderRadius: "8px",
      zIndex: 2147483647,
      fontFamily: "sans-serif"
    });
    document.body.appendChild(overlay);
  }

  let hideTimeout = null;
  let interval = null;
  let finished = false;  
  let loadingSince = null;

  function predictedRemaining(r){
    if(!isFinite(r)) return Infinity;
    if(r <= threshold) return r / normalRate;
    return (r - threshold) / fastRate + threshold / normalRate;
  }

  function updateOverlay(){
    if(finished) return; 
    if(!isFinite(video.duration)){
      overlay.textContent = "読み込み中...";

      if(loadingSince === null) loadingSince = Date.now();
      else if(Date.now() - loadingSince > loadingTimeoutMs){
        finish("動画が見つかりませんでした");
      }
      return;
    }
    loadingSince = null;

    const rem = Math.max(0, video.duration - video.currentTime);
    const pred = predictedRemaining(rem);
    const curRate = video.playbackRate;
    overlay.textContent =
      `速度: ${curRate.toFixed(1)}x | 残り(映像): ${rem.toFixed(1)}s | 予想残り: ${pred.toFixed(1)}s`;
  }

  function adjustPlaybackRate(){
    if(finished) return;
    if(!isFinite(video.duration)) return;
    const rem = Math.max(0, video.duration - video.currentTime);
    const want = rem <= threshold ? normalRate : fastRate;
    if(video.playbackRate !== want) video.playbackRate = want;
    updateOverlay();
  }

  function onEnded(){
    finish("完了");
  }

  function finish(msg){
    if(finished) return;
    finished = true;
    overlay.textContent = msg;
    if(hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(()=>{
      cleanup();
      if(overlay) overlay.remove();
    }, hideDelayMs);
  }

  function cleanup(){
    try{
      video.removeEventListener("timeupdate", adjustPlaybackRate);
      video.removeEventListener("ended", onEnded);
      if(interval) clearInterval(interval);
      if(hideTimeout) clearTimeout(hideTimeout);
    }catch(e){}
  }

  video.playbackRate = fastRate;
  video.play().catch(()=>{});

  video.addEventListener("timeupdate", adjustPlaybackRate);
  video.addEventListener("ended", onEnded);
  interval = setInterval(updateOverlay, 200);

  adjustPlaybackRate();
})();
