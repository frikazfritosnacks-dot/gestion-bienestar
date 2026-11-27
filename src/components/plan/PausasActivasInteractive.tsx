import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  PAUSAS_ACTIVAS_EXERCISES,
  PAUSAS_ACTIVAS_SAFETY_GUIDELINES,
} from '../../data/pausasActivasData';
import {
  ArticulatedPiggyLayers,
  loadArticulatedPiggyLayers,
} from '../mascot/FrikazPiggyMascot';

const OFFICIAL_PIGGY_FALLBACK_SRC = '/assets/aistudio/image_a7cf5f49.png';

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PausasActivasInteractive() {
  const [layers, setLayers] = useState<ArticulatedPiggyLayers | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    PAUSAS_ACTIVAS_EXERCISES[0].duracionSegundos
  );
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const currentExercise = PAUSAS_ACTIVAS_EXERCISES[activeIndex];
  const totalExercises = PAUSAS_ACTIVAS_EXERCISES.length;
  const isCompletedCurrent = remainingSeconds <= 0;
  const elapsedSeconds = Math.max(0, currentExercise.duracionSegundos - remainingSeconds);
  const exerciseProgressPct = Math.min(
    100,
    Math.round((elapsedSeconds / Math.max(1, currentExercise.duracionSegundos)) * 100)
  );

  useEffect(() => {
    let mounted = true;
    loadArticulatedPiggyLayers().then((res) => {
      if (mounted && res) setLayers(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying) return;

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          setCompletedIds((done) =>
            done.includes(currentExercise.id) ? done : [...done, currentExercise.id]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, currentExercise.id]);

  const selectExercise = (nextIdx: number, autoStart = false) => {
    const bounded = Math.max(0, Math.min(totalExercises - 1, nextIdx));
    setActiveIndex(bounded);
    setRemainingSeconds(PAUSAS_ACTIVAS_EXERCISES[bounded].duracionSegundos);
    setIsPlaying(autoStart);
    setHasStarted(autoStart);
  };

  const handleTogglePlay = () => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(currentExercise.duracionSegundos);
      setIsPlaying(true);
      setHasStarted(true);
      return;
    }
    setHasStarted(true);
    setIsPlaying((prev) => !prev);
  };

  const handleResetExercise = () => {
    setIsPlaying(false);
    setHasStarted(false);
    setRemainingSeconds(currentExercise.duracionSegundos);
  };

  const movementStateLabel = isCompletedCurrent
    ? 'Ejercicio completado'
    : isPlaying
      ? 'Demostración en movimiento'
      : hasStarted
        ? 'En pausa'
        : 'Listo para iniciar';

  const stagePoseClass = isPlaying
    ? `frikaz-exercise-stage frikaz-exercise-${currentExercise.poseId}`
    : hasStarted && !isCompletedCurrent
      ? `frikaz-exercise-stage frikaz-exercise-${currentExercise.poseId} frikaz-exercise-paused`
      : 'frikaz-exercise-stage frikaz-piggy-idle';

  return (
    <div className="space-y-6">
      {/* Cabecera informativa de la guía interactiva */}
      <section
        data-submodule-surface="true"
        data-piggy-context="programas:pausas-activas"
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#D61F26]">
              <Activity className="h-4 w-4 text-[#D97706]" />
              <span>ACTIVIDAD #1 · DIMENSIÓN FÍSICA · FRIKAZ S.A.S.</span>
            </div>
            <h2 className="font-display text-xl font-extrabold text-[#0F294A] sm:text-2xl">
              Pausas Activas Interactivas con la Mascota Frikaz
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm">
              Rutina guiada de 9 ejercicios suaves para oficina, producción y logística. Presiona{' '}
              <strong>Iniciar</strong> para activar la demostración del cerdito y el temporizador
              sincronizado.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#FDE047] bg-[#FFFBEB] px-4 py-2.5 shrink-0">
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#0F294A]/70">Ejercicios completados</p>
              <p className="font-mono text-base font-extrabold text-[#0F294A] tabular-nums">
                {completedIds.length} / {totalExercises}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-[#D61F26]" />
          </div>
        </div>

        {/* Selector rápido superior de ejercicios 1 al 9 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-9 pt-1">
          {PAUSAS_ACTIVAS_EXERCISES.map((ex, idx) => {
            const active = idx === activeIndex;
            const done = completedIds.includes(ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                data-piggy-ignore="true"
                onClick={() => selectExercise(idx, false)}
                className={`flex items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'border-[#D61F26] bg-[#D61F26] text-white shadow-xs'
                    : done
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 text-[#0F294A] hover:bg-[#FEF9C3]'
                }`}
                title={ex.nombre}
              >
                <span className="font-mono tabular-nums">{ex.numero}</span>
                {done && !active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Escenario principal: Cerdito articulado animando el ejercicio + Burbuja descriptiva lateral sin superposición */}
      <section className="rounded-2xl border-2 border-[#0F294A]/15 bg-white p-5 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          {/* Columna izquierda (5 cols): Escenario limpio del cerdito oficial */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between rounded-2xl border border-[#FDE047] bg-gradient-to-b from-[#FFFBEB] via-white to-[#EFF6FF]/60 p-5 min-h-[340px]">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#0F294A]">
                <Sparkles className="h-3.5 w-3.5 text-[#D61F26]" />
                Ejercicio {currentExercise.numero} de {totalExercises}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                  isCompletedCurrent
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPlaying
                      ? 'bg-[#FEE2E2] text-[#D61F26]'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isCompletedCurrent
                      ? 'bg-emerald-600'
                      : isPlaying
                        ? 'bg-[#D61F26] animate-pulse'
                        : 'bg-slate-400'
                  }`}
                />
                {movementStateLabel}
              </span>
            </div>

            {/* Personaje oficial Frikaz articulado en 6 capas */}
            <div className="my-4 flex flex-col items-center justify-center">
              <div
                className={`relative w-44 sm:w-52 aspect-[1123/1400] select-none ${stagePoseClass}`}
                aria-label={`Mascota Frikaz demostrando: ${currentExercise.nombre}`}
              >
                {layers ? (
                  <div className="piggy-sprite-wrap relative h-full w-full drop-shadow-sm">
                    <img
                      src={layers.leftArm}
                      alt=""
                      className="piggy-limb piggy-left-arm pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                      draggable={false}
                    />
                    <img
                      src={layers.rightArm}
                      alt=""
                      className="piggy-limb piggy-right-arm pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                      draggable={false}
                    />
                    <img
                      src={layers.leftLeg}
                      alt=""
                      className="piggy-limb piggy-left-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                      draggable={false}
                    />
                    <img
                      src={layers.rightLeg}
                      alt=""
                      className="piggy-limb piggy-right-leg pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                      draggable={false}
                    />
                    <img
                      src={layers.torso}
                      alt=""
                      className="piggy-limb piggy-torso pointer-events-none absolute inset-0 z-20 h-full w-full object-contain"
                      draggable={false}
                    />
                    <img
                      src={layers.head}
                      alt={`Mascota oficial Frikaz ejecutando ${currentExercise.nombre}`}
                      className="piggy-limb piggy-head pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <img
                    src={OFFICIAL_PIGGY_FALLBACK_SRC}
                    alt="Mascota oficial Frikaz S.A.S."
                    className="h-full w-full object-contain mix-blend-multiply"
                    draggable={false}
                  />
                )}
                <div className="piggy-shadow-layer pointer-events-none mx-auto -mt-3 h-3 w-3/5 rounded-full bg-[#0F294A]/25 blur-[2px]" />
              </div>
              <div className="mt-1 h-0.5 w-40 rounded-full bg-slate-200" />
            </div>

            {/* Temporizador sincronizado al pie del escenario */}
            <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F294A]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#D61F26]" />
                  Temporizador sincronizado
                </span>
                <span className="font-mono text-lg font-extrabold text-[#D61F26] tabular-nums">
                  {formatClock(remainingSeconds)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompletedCurrent ? 'bg-emerald-500' : 'bg-[#D61F26]'
                  }`}
                  style={{ width: `${exerciseProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Columna derecha (7 cols): Burbuja de diálogo descriptiva ubicada al costado sin tapar personaje ni botones */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="relative rounded-2xl border-2 border-[#0F294A] bg-[#F8FAFC] p-6 shadow-xs">
              {/* Cola de diálogo apuntando hacia el cerdito en escritorio */}
              <div
                aria-hidden="true"
                className="hidden lg:block absolute -left-3.5 top-12 h-6 w-6 rotate-45 border-l-2 border-b-2 border-[#0F294A] bg-[#F8FAFC]"
              />
              {/* Cola superior en pantallas móviles/tablet */}
              <div
                aria-hidden="true"
                className="lg:hidden absolute left-10 -top-3.5 h-6 w-6 rotate-45 border-l-2 border-t-2 border-[#0F294A] bg-[#F8FAFC]"
              />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#D61F26]">
                      Zona trabajada: {currentExercise.zonaTrabajada}
                    </span>
                    <h3 className="font-display text-lg font-extrabold text-[#0F294A] sm:text-xl">
                      {currentExercise.numero}. {currentExercise.nombre}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wide text-[#0F294A]">
                      Cómo realizarlo
                    </strong>
                    <p className="mt-1">{currentExercise.instruccion}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#FDE047] bg-[#FFFBEB] p-3">
                      <strong className="block text-[11px] font-extrabold uppercase tracking-wide text-[#0F294A]">
                        Duración y repeticiones
                      </strong>
                      <p className="mt-1 text-xs font-semibold text-[#0F294A] tabular-nums">
                        {currentExercise.repeticionesTexto}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#0F294A]/15 bg-[#EFF6FF] p-3">
                      <strong className="block text-[11px] font-extrabold uppercase tracking-wide text-[#0F294A]">
                        Recomendación básica
                      </strong>
                      <p className="mt-1 text-xs text-slate-700">
                        {currentExercise.recomendacionBasica}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles claros de reproducción */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-piggy-ignore="true"
                disabled={activeIndex === 0}
                onClick={() => selectExercise(activeIndex - 1, false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0F294A] hover:border-[#0F294A] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <button
                type="button"
                data-piggy-ignore="true"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D61F26] border-b-2 border-[#FACC15] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#B3161C] cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 text-[#FACC15]" />
                    Pausar
                  </>
                ) : isCompletedCurrent ? (
                  <>
                    <RotateCcw className="h-4 w-4 text-[#FACC15]" />
                    Repetir ejercicio
                  </>
                ) : hasStarted ? (
                  <>
                    <Play className="h-4 w-4 text-[#FACC15]" />
                    Reanudar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 text-[#FACC15]" />
                    Iniciar
                  </>
                )}
              </button>

              <button
                type="button"
                data-piggy-ignore="true"
                onClick={handleResetExercise}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0F294A] hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#D61F26]" />
                Reiniciar ejercicio
              </button>

              <button
                type="button"
                data-piggy-ignore="true"
                disabled={activeIndex === totalExercises - 1}
                onClick={() => selectExercise(activeIndex + 1, false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F294A] px-4 py-2.5 text-xs font-bold text-[#FACC15] hover:bg-[#163A66] disabled:opacity-40 cursor-pointer ml-auto"
              >
                Siguiente ejercicio
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Listado descriptivo completo de los 9 ejercicios */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#0F294A]">
            Secuencia completa de la pausa activa ({totalExercises} ejercicios)
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {PAUSAS_ACTIVAS_EXERCISES.map((ex, idx) => {
              const active = idx === activeIndex;
              const done = completedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  data-piggy-ignore="true"
                  onClick={() => selectExercise(idx, false)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#D61F26] bg-[#FEF2F2]'
                      : done
                        ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'
                        : 'border-slate-200 bg-white hover:border-[#0F294A]/40'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-extrabold tabular-nums ${
                      active
                        ? 'bg-[#D61F26] text-white'
                        : done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0F294A] text-[#FACC15]'
                    }`}
                  >
                    {ex.numero}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F294A] line-clamp-1">{ex.nombre}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {ex.zonaTrabajada} · {ex.duracionSegundos} s
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recomendaciones básicas de seguridad y alcance preventivo */}
      <section className="rounded-2xl border-2 border-[#FDE047] bg-[#FFFBEB] p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-[#0F294A]">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[#D61F26]" />
          <h3 className="font-display text-base font-extrabold">
            {PAUSAS_ACTIVAS_SAFETY_GUIDELINES.titulo}
          </h3>
        </div>
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {PAUSAS_ACTIVAS_SAFETY_GUIDELINES.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 rounded-xl border border-[#FDE047]/80 bg-white p-3 text-xs leading-relaxed text-[#0F294A]"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
