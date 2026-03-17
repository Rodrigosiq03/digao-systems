#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'MSG'
Uso:
  launch-game.sh --command '<comando>' [--game-id '<id>']

Exemplo:
  launch-game.sh --command 'steam -applaunch 730' --game-id steam-cs2
MSG
}

command_value=""
game_id="unknown"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --command)
      shift
      command_value="${1:-}"
      ;;
    --game-id)
      shift
      game_id="${1:-unknown}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERR] argumento invalido: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift || true
done

if [[ -z "${command_value}" ]]; then
  echo "[ERR] --command e obrigatorio" >&2
  usage >&2
  exit 1
fi

is_stop_command=false
if [[ "${command_value}" == *"/data/apps/deploy/cloud-gaming/host/stop-game.sh"* ]]; then
  is_stop_command=true
fi

uid_current="$(id -u)"
user_name="$(id -un)"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/${uid_current}}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
export CLOUD_GAMING_GAME_ID="${game_id}"

if [[ -z "${XAUTHORITY:-}" ]]; then
  runtime_xauth="$(
    find "${XDG_RUNTIME_DIR}" -maxdepth 1 -type f -name 'xauth_*' 2>/dev/null \
      | sort | head -n1
  )"
  if [[ -n "${runtime_xauth}" ]]; then
    export XAUTHORITY="${runtime_xauth}"
  elif [[ -f "${HOME}/.Xauthority" ]]; then
    export XAUTHORITY="${HOME}/.Xauthority"
  fi
fi

if [[ -z "${WAYLAND_DISPLAY:-}" && -d "${XDG_RUNTIME_DIR}" ]]; then
  first_wayland="$(
    find "${XDG_RUNTIME_DIR}" -maxdepth 1 -type s -name 'wayland-*' 2>/dev/null \
      | sort | head -n1
  )"
  if [[ -n "${first_wayland}" ]]; then
    export WAYLAND_DISPLAY="$(basename "${first_wayland}")"
  fi
fi

if [[ -z "${DISPLAY:-}" ]]; then
  if [[ -S /tmp/.X11-unix/X0 ]]; then
    export DISPLAY=:0
  elif [[ -S /tmp/.X11-unix/X1 ]]; then
    export DISPLAY=:1
  fi
fi

if [[ -z "${DISPLAY:-}" && -z "${WAYLAND_DISPLAY:-}" ]]; then
  echo "[ERR] sem DISPLAY/WAYLAND_DISPLAY. Inicie uma sessao grafica no host." >&2
  exit 1
fi

bool_env() {
  local raw="${1:-}"
  raw="$(printf '%s' "${raw}" | tr '[:upper:]' '[:lower:]')"
  case "${raw}" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

run_unlock_helper() {
  local helper="${CLOUD_GAMING_UNLOCK_HELPER:-/data/apps/deploy/cloud-gaming/host/unlock-kde-session.sh}"
  if [[ -x "${helper}" ]]; then
    "${helper}" "${user_name}" >/dev/null 2>&1 || true
    return
  fi

  local session_to_unlock
  session_to_unlock="$(
    loginctl list-sessions --no-legend 2>/dev/null \
      | awk -v user="${user_name}" '$3 == user { print $1 }' \
      | while read -r sid; do
          [[ -n "${sid}" ]] || continue
          type="$(loginctl show-session "${sid}" -p Type --value 2>/dev/null || true)"
          active="$(loginctl show-session "${sid}" -p Active --value 2>/dev/null || true)"
          class="$(loginctl show-session "${sid}" -p Class --value 2>/dev/null || true)"
          if [[ "${active}" == "yes" && "${class}" == "user" && ( "${type}" == "wayland" || "${type}" == "x11" ) ]]; then
            echo "${sid}"
            break
          fi
        done
  )"
  if [[ -n "${session_to_unlock}" ]]; then
    loginctl unlock-session "${session_to_unlock}" >/dev/null 2>&1 || true
    busctl --user call org.freedesktop.ScreenSaver /ScreenSaver org.freedesktop.ScreenSaver SetActive b false >/dev/null 2>&1 || true
    busctl --user call org.freedesktop.ScreenSaver /ScreenSaver org.freedesktop.ScreenSaver SimulateUserActivity >/dev/null 2>&1 || true
  fi
}

shutdown_steam_desktop() {
  if ! bool_env "${STEAM_FORCE_SINGLE_INSTANCE:-true}"; then
    return
  fi
  if [[ "${command_value}" != *"steam -applaunch"* ]]; then
    return
  fi

  steam -shutdown >/dev/null 2>&1 || true
  pkill -x steam >/dev/null 2>&1 || true
  pkill -f steamwebhelper >/dev/null 2>&1 || true

  for _ in $(seq 1 20); do
    if ! pgrep -x steam >/dev/null 2>&1 && ! pgrep -f steamwebhelper >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done
}

terminate_pid() {
  local pid="${1:-0}"
  if [[ "${pid}" -le 0 ]]; then
    return
  fi
  if ! kill -0 "${pid}" >/dev/null 2>&1; then
    return
  fi

  kill "${pid}" >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do
    if ! kill -0 "${pid}" >/dev/null 2>&1; then
      return
    fi
    sleep 0.5
  done
  kill -KILL "${pid}" >/dev/null 2>&1 || true
}

log_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/digao-cloud-gaming"
runtime_dir="${XDG_RUNTIME_DIR}/digao-cloud-gaming"
mkdir -p "${log_dir}" "${runtime_dir}"
log_file="${log_dir}/launcher.log"
state_file="${runtime_dir}/session.env"

write_state() {
  cat >"${state_file}" <<STATE
GAME_ID=${game_id}
COMMAND=${command_value}
STARTED_AT=$(date -Iseconds)
STATE
}

clear_state() {
  rm -f "${state_file}"
}

start_activity_keepalive() {
  (
    while true; do
      busctl --user call org.freedesktop.ScreenSaver /ScreenSaver org.freedesktop.ScreenSaver SetActive b false >/dev/null 2>&1 || true
      busctl --user call org.freedesktop.ScreenSaver /ScreenSaver org.freedesktop.ScreenSaver SimulateUserActivity >/dev/null 2>&1 || true
      sleep "${CLOUD_GAMING_IDLE_KEEPALIVE_SEC:-20}"
    done
  ) >/dev/null 2>&1 &
  echo $!
}

cleanup_done=0
keepalive_pid=0
child_pid=0

find_gamescope_node_id() {
  pw-cli ls Node 2>/dev/null | awk '
    BEGIN { id=""; name=""; class=""; found="" }
    /^[[:space:]]*id [0-9]+, type PipeWire:Interface:Node\/3/ {
      if (id != "" && name == "gamescope" && class == "Video/Source") {
        found = id
        print id
        exit
      }
      id = $2
      sub(/,/, "", id)
      name = ""
      class = ""
      next
    }
    /node.name = "gamescope"/ { name = "gamescope"; next }
    /media.class = "Video\/Source"/ { class = "Video/Source"; next }
    END {
      if (found == "" && id != "" && name == "gamescope" && class == "Video/Source") {
        print id
      }
    }
  '
}

restart_motor_for_gamescope_async() {
  (
    local node_id=""
    local deadline=$(( $(date +%s) + ${CAPTURE_GAMESCOPE_WAIT_SEC:-12} ))
    while [[ $(date +%s) -lt ${deadline} ]]; do
      node_id="$(find_gamescope_node_id || true)"
      if [[ -n "${node_id}" ]]; then
        {
          echo "[$(date -Iseconds)] gamescope node ready: ${node_id}"
          echo "[$(date -Iseconds)] restarting cloud-gaming-motor for gamescope capture"
        } >> "${log_file}"
        systemctl --user restart cloud-gaming-motor.service >/dev/null 2>&1 || true
        exit 0
      fi
      sleep 1
    done
    echo "[$(date -Iseconds)] gamescope node not found before timeout; motor not restarted" >> "${log_file}"
  ) >/dev/null 2>&1 &
}

cleanup_runtime() {
  if [[ "${cleanup_done}" -eq 1 ]]; then
    return
  fi
  cleanup_done=1
  terminate_pid "${keepalive_pid}"
  run_unlock_helper
  clear_state
}

on_signal() {
  local sig="${1}"
  {
    echo "[$(date -Iseconds)] signal=${sig} game_id=${game_id}"
  } >> "${log_file}"
  terminate_pid "${child_pid}"
  cleanup_runtime
  exit 143
}

trap 'on_signal TERM' TERM
trap 'on_signal INT' INT
trap 'cleanup_runtime' EXIT

export GDK_BACKEND="${GDK_BACKEND:-x11}"
export SDL_VIDEODRIVER="${SDL_VIDEODRIVER:-x11}"

gamescope_enabled=false
if bool_env "${GAMESCOPE_ENABLED:-false}"; then
  gamescope_enabled=true
fi

gamescope_backend="${GAMESCOPE_BACKEND:-wayland}"
gamescope_output_width="${GAMESCOPE_OUTPUT_WIDTH:-1920}"
gamescope_output_height="${GAMESCOPE_OUTPUT_HEIGHT:-1080}"
gamescope_game_width="${GAMESCOPE_GAME_WIDTH:-1280}"
gamescope_game_height="${GAMESCOPE_GAME_HEIGHT:-720}"
gamescope_refresh="${GAMESCOPE_REFRESH:-60}"
gamescope_scaler="${GAMESCOPE_SCALER:-fit}"
gamescope_filter="${GAMESCOPE_FILTER:-linear}"

{
  echo "[$(date -Iseconds)] launch begin"
  echo "  game_id=${game_id}"
  echo "  cmd=${command_value}"
  echo "  DISPLAY=${DISPLAY:-}"
  echo "  WAYLAND_DISPLAY=${WAYLAND_DISPLAY:-}"
  echo "  XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR}"
  echo "  XAUTHORITY=${XAUTHORITY:-}"
  echo "  GAMESCOPE_ENABLED=${gamescope_enabled}"
} >> "${log_file}"

if [[ "${is_stop_command}" == "true" ]]; then
  run_unlock_helper
  {
    echo "  stop_command=true"
  } >> "${log_file}"
  set +e
  /usr/bin/env bash -lc "${command_value}" >> "${log_file}" 2>&1 &
  child_pid=$!
  wait "${child_pid}"
  status=$?
  set -e
  cleanup_runtime
  exit "${status}"
elif [[ "${gamescope_enabled}" == "true" ]]; then
  run_unlock_helper
  shutdown_steam_desktop
  write_state
  keepalive_pid="$(start_activity_keepalive)"

  export DISABLE_MANGOHUD=1
  export MANGOHUD=0
  export DISABLE_VK_LAYER_VALVE_steam_overlay_1=1
  export ENABLE_VK_LAYER_VALVE_steam_overlay_1=0
  export ENABLE_GAMESCOPE_WSI="${ENABLE_GAMESCOPE_WSI:-0}"

  gamescope_cmd=(
    /usr/bin/gamescope
    --backend "${gamescope_backend}"
    --expose-wayland
    -W "${gamescope_output_width}"
    -H "${gamescope_output_height}"
    -w "${gamescope_game_width}"
    -h "${gamescope_game_height}"
    -r "${gamescope_refresh}"
    -S "${gamescope_scaler}"
    -F "${gamescope_filter}"
  )

  if bool_env "${GAMESCOPE_FULLSCREEN:-true}"; then
    gamescope_cmd+=(-f)
  fi
  if bool_env "${GAMESCOPE_BORDERLESS:-true}"; then
    gamescope_cmd+=(-b)
  fi
  if bool_env "${GAMESCOPE_GRAB:-true}"; then
    gamescope_cmd+=(-g)
  fi
  if bool_env "${GAMESCOPE_FORCE_GRAB_CURSOR:-true}"; then
    gamescope_cmd+=(--force-grab-cursor)
  fi
  if [[ -n "${GAMESCOPE_EXTRA_ARGS:-}" ]]; then
    # shellcheck disable=SC2206
    extra_args=( ${GAMESCOPE_EXTRA_ARGS} )
    gamescope_cmd+=("${extra_args[@]}")
  fi

  gamescope_cmd+=(-- /usr/bin/env bash -lc "${command_value}")

  {
    echo "  steam_force_single_instance=${STEAM_FORCE_SINGLE_INSTANCE:-true}"
    echo "  DISABLE_MANGOHUD=${DISABLE_MANGOHUD}"
    echo "  DISABLE_VK_LAYER_VALVE_steam_overlay_1=${DISABLE_VK_LAYER_VALVE_steam_overlay_1}"
    echo "  ENABLE_GAMESCOPE_WSI=${ENABLE_GAMESCOPE_WSI}"
    echo "  gamescope_backend=${gamescope_backend}"
    echo "  gamescope_output=${gamescope_output_width}x${gamescope_output_height}"
    echo "  gamescope_game=${gamescope_game_width}x${gamescope_game_height}@${gamescope_refresh}"
    printf '  gamescope_exec='
    printf '%q ' "${gamescope_cmd[@]}"
    echo
  } >> "${log_file}"

  set +e
  "${gamescope_cmd[@]}" >> "${log_file}" 2>&1 &
  child_pid=$!
  restart_motor_for_gamescope_async
  wait "${child_pid}"
  status=$?
  set -e
else
  run_unlock_helper
  shutdown_steam_desktop
  write_state
  keepalive_pid="$(start_activity_keepalive)"

  set +e
  /usr/bin/env bash -lc "${command_value}" >> "${log_file}" 2>&1 &
  child_pid=$!
  wait "${child_pid}"
  status=$?
  set -e
fi

cleanup_runtime
exit "${status}"
