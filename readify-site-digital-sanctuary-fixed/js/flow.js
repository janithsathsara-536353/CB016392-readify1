(function(){
  const rainBtn = document.getElementById("rainBtn");
  const fireBtn = document.getElementById("fireBtn");
  const stopAll = document.getElementById("stopAll");

  const pick = document.getElementById("pickComplete");
  const mark = document.getElementById("markComplete");
  const clear = document.getElementById("clearCompleted");
  const ul = document.getElementById("completedList");

  const LIST_KEY = "readify_reading_list";
  const DONE_KEY = "readify_completed_books";

  // ---- Completed books ----
  function loadList(){
    return loadLS(LIST_KEY, []);
  }
  function loadDone(){
    return loadLS(DONE_KEY, []);
  }
  function renderPick(){
    const list = loadList();
    pick.innerHTML = "";
    if(list.length === 0){
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No reading list found — save books first.";
      pick.appendChild(opt);
      pick.disabled = true;
      mark.disabled = true;
      return;
    }
    pick.disabled = false;
    mark.disabled = false;

    list.forEach(b=>{
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = `${b.title} — ${b.author}`;
      pick.appendChild(opt);
    });
  }
  function renderDone(){
    const done = loadDone();
    ul.innerHTML = "";
    if(done.length === 0){
      ul.innerHTML = "<li>Nothing completed yet. Go read, legend.</li>";
      return;
    }
    done.forEach(x=>{
      const li = document.createElement("li");
      li.textContent = `${x.title} (${x.when})`;
      ul.appendChild(li);
    });
  }

  mark.addEventListener("click", ()=>{
    const id = pick.value;
    if(!id){ toast("Pick a book first."); return; }
    const list = loadList();
    const item = list.find(x=>x.id === id);
    if(!item){ toast("Book not found in reading list."); return; }

    const done = loadDone();
    if(done.some(x=>x.id === id)){
      toast("Already marked completed.");
      return;
    }
    const when = new Date().toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"});
    done.push({ id, title: item.title, when });
    saveLS(DONE_KEY, done);
    toast("Marked as completed 🎉");
    renderDone();
  });

  clear.addEventListener("click", ()=>{
    localStorage.removeItem(DONE_KEY);
    toast("Completed list cleared.");
    renderDone();
  });

  // ---- Cozy sounds (Web Audio API) ----
  let ctx = null;
  function getCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // Rain: filtered noise
  let rainNode = null;
  function startRain(){
    const c = getCtx();
    const bufferSize = 2 * c.sampleRate;
    const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++){ output[i] = Math.random()*2 - 1; }

    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 700;

    const gain = c.createGain();
    gain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    noise.start();
    rainNode = { noise, gain };
  }
  function stopRain(){
    if(!rainNode) return;
    try{ rainNode.noise.stop(); }catch(e){}
    rainNode = null;
  }

  // Fireplace: low rumble + crackle (noise bursts)
  let fireNode = null;
  function startFire(){
    const c = getCtx();
    const master = c.createGain();
    master.gain.value = 0.10;

    // Rumble
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;

    const rumbleGain = c.createGain();
    rumbleGain.gain.value = 0.35;

    // Crackle (noise through bandpass)
    const bufferSize = 2 * c.sampleRate;
    const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++){ out[i] = Math.random()*2 - 1; }

    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1700;
    bp.Q.value = 0.8;

    const crackleGain = c.createGain();
    crackleGain.gain.value = 0.0;

    // Random crackle envelopes
    const crackleTimer = setInterval(()=>{
      if(!fireNode) return;
      const t = c.currentTime;
      crackleGain.gain.cancelScheduledValues(t);
      crackleGain.gain.setValueAtTime(0.0, t);
      const peak = Math.random() * 0.12;
      crackleGain.gain.linearRampToValueAtTime(peak, t + 0.01);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.10 + Math.random()*0.20);
    }, 180);

    osc.connect(rumbleGain);
    rumbleGain.connect(master);

    noise.connect(bp);
    bp.connect(crackleGain);
    crackleGain.connect(master);

    master.connect(c.destination);

    osc.start();
    noise.start();

    fireNode = { osc, noise, master, crackleTimer };
  }
  function stopFire(){
    if(!fireNode) return;
    try{ fireNode.osc.stop(); }catch(e){}
    try{ fireNode.noise.stop(); }catch(e){}
    clearInterval(fireNode.crackleTimer);
    fireNode = null;
  }

  function setBtn(btn, name, on){
    btn.textContent = on ? `${name}: On` : `${name}: Off`;
    btn.classList.toggle("primary", on);
  }

  rainBtn.addEventListener("click", async ()=>{
    try{ await getCtx().resume(); }catch(e){}
    if(rainNode){
      stopRain();
      setBtn(rainBtn, "🌧️ Rain", false);
      toast("Rain off.");
    }else{
      startRain();
      setBtn(rainBtn, "🌧️ Rain", true);
      toast("Rain on.");
    }
  });

  fireBtn.addEventListener("click", async ()=>{
    try{ await getCtx().resume(); }catch(e){}
    if(fireNode){
      stopFire();
      setBtn(fireBtn, "🔥 Fireplace", false);
      toast("Fireplace off.");
    }else{
      startFire();
      setBtn(fireBtn, "🔥 Fireplace", true);
      toast("Fireplace on.");
    }
  });

  stopAll.addEventListener("click", ()=>{
    stopRain(); stopFire();
    setBtn(rainBtn, "🌧️ Rain", false);
    setBtn(fireBtn, "🔥 Fireplace", false);
    toast("All sounds stopped.");
  });

  // init
  renderPick();
  renderDone();
})();