import sys
import time

try:
    from evdev import UInput, ecodes as e
except ImportError:
    print("Erro: python3-evdev não instalado.")
    sys.exit(1)

char_map = {
    'a': e.KEY_A, 'b': e.KEY_B, 'c': e.KEY_C, 'd': e.KEY_D, 'e': e.KEY_E, 'f': e.KEY_F, 'g': e.KEY_G,
    'h': e.KEY_H, 'i': e.KEY_I, 'j': e.KEY_J, 'k': e.KEY_K, 'l': e.KEY_L, 'm': e.KEY_M, 'n': e.KEY_N,
    'o': e.KEY_O, 'p': e.KEY_P, 'q': e.KEY_Q, 'r': e.KEY_R, 's': e.KEY_S, 't': e.KEY_T, 'u': e.KEY_U,
    'v': e.KEY_V, 'w': e.KEY_W, 'x': e.KEY_X, 'y': e.KEY_Y, 'z': e.KEY_Z,
    '1': e.KEY_1, '2': e.KEY_2, '3': e.KEY_3, '4': e.KEY_4, '5': e.KEY_5, '6': e.KEY_6, '7': e.KEY_7,
    '8': e.KEY_8, '9': e.KEY_9, '0': e.KEY_0,
    ' ': e.KEY_SPACE, '\n': e.KEY_ENTER, '\t': e.KEY_TAB,
    '-': e.KEY_MINUS, '=': e.KEY_EQUAL, '[': e.KEY_LEFTBRACE, ']': e.KEY_RIGHTBRACE,
    '\\': e.KEY_BACKSLASH, ';': e.KEY_SEMICOLON, '\'': e.KEY_APOSTROPHE, ',': e.KEY_COMMA,
    '.': e.KEY_DOT, '/': e.KEY_SLASH, '`': e.KEY_GRAVE,
}

shift_map = {
    'A': e.KEY_A, 'B': e.KEY_B, 'C': e.KEY_C, 'D': e.KEY_D, 'E': e.KEY_E, 'F': e.KEY_F, 'G': e.KEY_G,
    'H': e.KEY_H, 'I': e.KEY_I, 'J': e.KEY_J, 'K': e.KEY_K, 'L': e.KEY_L, 'M': e.KEY_M, 'N': e.KEY_N,
    'O': e.KEY_O, 'P': e.KEY_P, 'Q': e.KEY_Q, 'R': e.KEY_R, 'S': e.KEY_S, 'T': e.KEY_T, 'U': e.KEY_U,
    'V': e.KEY_V, 'W': e.KEY_W, 'X': e.KEY_X, 'Y': e.KEY_Y, 'Z': e.KEY_Z,
    '!': e.KEY_1, '@': e.KEY_2, '#': e.KEY_3, '$': e.KEY_4, '%': e.KEY_5, '^': e.KEY_6, '&': e.KEY_7,
    '*': e.KEY_8, '(': e.KEY_9, ')': e.KEY_0,
    '_': e.KEY_MINUS, '+': e.KEY_EQUAL, '{': e.KEY_LEFTBRACE, '}': e.KEY_RIGHTBRACE,
    '|': e.KEY_BACKSLASH, ':': e.KEY_SEMICOLON, '"': e.KEY_APOSTROPHE, '<': e.KEY_COMMA,
    '>': e.KEY_DOT, '?': e.KEY_SLASH, '~': e.KEY_GRAVE,
}

capabilities = {
    e.EV_REL: (e.REL_X, e.REL_Y, e.REL_WHEEL),
    e.EV_KEY: [e.BTN_LEFT, e.BTN_RIGHT, e.BTN_MIDDLE, e.KEY_LEFTSHIFT, e.KEY_BACKSPACE, e.KEY_ENTER] + list(char_map.values())
}

try:
    with UInput(capabilities, name='agent-virtual-mouse', version=0x3) as ui:
        print("READY")
        sys.stdout.flush()
        
        for line in sys.stdin:
            parts = line.strip('\r\n').split(' ', 1)
            if not parts or not parts[0]: continue
            
            cmd = parts[0]
            if cmd == 'MOVE':
                args = parts[1].split() if len(parts) > 1 else []
                if len(args) >= 2:
                    dx, dy = int(args[0]), int(args[1])
                    ui.write(e.EV_REL, e.REL_X, dx)
                    ui.write(e.EV_REL, e.REL_Y, dy)
                    ui.syn()
            elif cmd == 'SCROLL':
                args = parts[1] if len(parts) > 1 else "0"
                dy = int(args)
                ui.write(e.EV_REL, e.REL_WHEEL, dy)
                ui.syn()
            elif cmd == 'CLICK':
                args = parts[1] if len(parts) > 1 else 'left'
                btn = e.BTN_LEFT
                if args == 'right': btn = e.BTN_RIGHT
                elif args == 'middle': btn = e.BTN_MIDDLE
                
                ui.write(e.EV_KEY, btn, 1)
                ui.syn()
                time.sleep(0.05)
                ui.write(e.EV_KEY, btn, 0)
                ui.syn()
            elif cmd == 'TYPE':
                if len(parts) > 1:
                    text = parts[1]
                    for char in text:
                        if char in char_map:
                            kc = char_map[char]
                            ui.write(e.EV_KEY, kc, 1)
                            ui.syn()
                            time.sleep(0.02)
                            ui.write(e.EV_KEY, kc, 0)
                            ui.syn()
                        elif char in shift_map:
                            kc = shift_map[char]
                            ui.write(e.EV_KEY, e.KEY_LEFTSHIFT, 1)
                            ui.syn()
                            ui.write(e.EV_KEY, kc, 1)
                            ui.syn()
                            time.sleep(0.02)
                            ui.write(e.EV_KEY, kc, 0)
                            ui.syn()
                            ui.write(e.EV_KEY, e.KEY_LEFTSHIFT, 0)
                            ui.syn()
                        time.sleep(0.01)
            elif cmd == 'KEY':
                if len(parts) > 1:
                    key = parts[1].lower()
                    kc = None
                    if key == 'enter': kc = e.KEY_ENTER
                    elif key == 'backspace': kc = e.KEY_BACKSPACE
                    elif key == 'space': kc = e.KEY_SPACE
                    
                    if kc:
                        ui.write(e.EV_KEY, kc, 1)
                        ui.syn()
                        time.sleep(0.02)
                        ui.write(e.EV_KEY, kc, 0)
                        ui.syn()

except Exception as err:
    print("FATAL ERROR:", err)
    sys.exit(1)
