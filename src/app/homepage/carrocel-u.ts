export function iniciarCarrosselU(
  wrapper: HTMLElement,
  track: HTMLElement,
  opts: { speed?: number; rise?: number; tilt?: number; zoom?: number } = {}
): () => void {
  const speed = opts.speed ?? 45; // velocidade, px por segundo
  const rise = opts.rise ?? 110;  // altura do U: quanto as pontas sobem (px)
  const tilt = opts.tilt ?? 14;   // inclinação dos cards nas pontas (graus)
  const zoom = opts.zoom ?? 0.1;  // quanto o card do centro cresce (0.1 = 10%)

  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cards: HTMLElement[] = [];
  let centros: number[] = [];
  let metade = 0;          // largura de uma lista (a outra é a cópia)
  let assinatura = -1;     // detecta quando os cards mudam (ex.: vieram da API)
  let offset = 0;
  let pausado = false;
  let ultimo = performance.now();
  let raf = 0;

  const medir = () => {
    cards = Array.from(track.querySelectorAll<HTMLElement>('.coin-card'));
    assinatura = cards.length;
    if (cards.length < 2) {
      metade = 0;
      return;
    }
    const n = Math.floor(cards.length / 2);
    metade = cards[n].offsetLeft - cards[0].offsetLeft;
    centros = cards.map(c => c.offsetLeft + c.offsetWidth / 2);
  };

  const quadro = (agora: number) => {
    const dt = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;

    if (track.children.length !== assinatura) medir();

    if (!pausado && !reduzir && metade > 0) {
      offset = (offset + speed * dt) % metade;
    }
    track.style.transform = `translate3d(${-offset}px,0,0)`;

    const meio = wrapper.clientWidth / 2;
    for (let i = 0; i < cards.length; i++) {
      // -1 = borda esquerda, 0 = centro, 1 = borda direita
      const t = Math.max(-1.6, Math.min(1.6, (centros[i] - offset - meio) / meio));
      const y = -rise * t * t;               // curva em U
      const rot = -t * tilt;                 // acompanha a curva
      const esc = 1 + zoom * Math.max(0, 1 - t * t);
      cards[i].style.transform =
        `translate3d(0,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${esc.toFixed(3)})`;
    }

    raf = requestAnimationFrame(quadro);
  };

  const pausar = () => (pausado = true);
  const retomar = () => (pausado = false);
  wrapper.addEventListener('mouseenter', pausar);
  wrapper.addEventListener('mouseleave', retomar);

  medir();
  raf = requestAnimationFrame(quadro);

  return () => {
    cancelAnimationFrame(raf);
    wrapper.removeEventListener('mouseenter', pausar);
    wrapper.removeEventListener('mouseleave', retomar);
  };
}
