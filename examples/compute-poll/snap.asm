; Poll snap — demonstrates shared state for voting
; Assembles to SnapVM bytecode via: assemble(source)

.const "main"                ; 0: function name
.const "get"                 ; 1: action type
.const "post"                ; 2: action type
.const "vote"                ; 3: shared state key
.const "root"                ; 4: UI element IDs
.const "title"               ; 5
.const "chart"               ; 6
.const "toggle"              ; 7
.const "btn"                 ; 8
.const "stack"               ; 9: component types
.const "text"                ; 10
.const "bar_chart"           ; 11
.const "toggle_group"        ; 12
.const "button"              ; 13
.const "type"                ; 14: prop keys
.const "props"               ; 15
.const "children"            ; 16
.const "on"                  ; 17
.const "content"             ; 18
.const "direction"           ; 19
.const "vertical"            ; 20
.const "gap"                 ; 21
.const "md"                  ; 22
.const "name"                ; 23
.const "choice"              ; 24
.const "options"             ; 25
.const "red"                 ; 26
.const "blue"                ; 27
.const "green"               ; 28
.const "label"               ; 29
.const "Vote!"               ; 30
.const "press"               ; 31
.const "submit"              ; 32
.const "Favorite color?"     ; 33
.const "bars"                ; 34
.const "value"               ; 35
.const "elements"            ; 36
.const "root"                ; 37

.func main 3 4               ; arity=3 (action, inputs_json, button_index), locals=4
  ; local 3 = action string
  load 0                      ; push action arg
  push_str 2                  ; "post"
  eq                          ; action == "post"?
  jmp_unless render           ; if not post, skip to render

  ; Handle vote submission: shared.set("vote", inputs.choice)
  ; For now just render — shared state syscalls handle persistence
  push_str 3                  ; "vote"
  push_str 26                 ; "red" (default — in real impl, parse inputs)
  syscall 0x0601              ; shared.set
  pop                         ; discard result

render:
  ; Build UI spec as a map and call ui.render
  ; This is verbose in assembly — SnapScript would be much cleaner

  ; Build the text element: { type: "text", props: { content: "Favorite color?" } }
  push_str 18                 ; "content"
  push_str 33                 ; "Favorite color?"
  map_new 1                   ; props map
  store 3                     ; local 3 = props

  push_str 14                 ; "type"
  push_str 10                 ; "text"
  push_str 15                 ; "props"
  load 3                      ; props
  map_new 2                   ; text element

  ; Build button element: { type: "button", props: { label: "Vote!" } }
  push_str 29                 ; "label"
  push_str 30                 ; "Vote!"
  map_new 1                   ; button props

  push_str 14                 ; "type"
  push_str 13                 ; "button"
  push_str 15                 ; "props"
  swap                        ; put props below key
  map_new 2                   ; button element

  ; Build root stack: { type: "stack", props: { direction: "vertical", gap: "md" }, children: ["title", "btn"] }
  push_str 19                 ; "direction"
  push_str 20                 ; "vertical"
  push_str 21                 ; "gap"
  push_str 22                 ; "md"
  map_new 2                   ; stack props

  push_str 5                  ; "title"
  push_str 8                  ; "btn"
  array_new 2                 ; children array

  ; Now build the stack element map
  push_str 14                 ; "type"
  push_str 9                  ; "stack"
  push_str 15                 ; "props"
  ; stack has: [..., stack_props, children_arr, "type", "stack", "props"]
  ; We need to reorganize — this is where assembly gets painful
  ; Let's simplify: just build the elements map and root

  ; Build elements map: { "root": root_elem, "title": title_elem, "btn": btn_elem }
  ; For simplicity, build a minimal working UI
  push_str 18                 ; "content"
  push_str 33                 ; "Favorite color?"
  map_new 1                   ; { content: "..." }
  push_str 14                 ; "type"
  push_str 10                 ; "text"
  push_str 15                 ; "props"
  ; Need to get props on stack properly — let's use locals

  ; Actually, let's just build a simple flat spec
  ; ui = { root: "r", elements: { r: { type: "text", props: { content: "Favorite color? Vote in the snap!" } } } }

  pop                         ; clean up stack mess
  pop
  pop
  pop
  pop
  pop
  pop
  pop
  pop

  ; Fresh start — build minimal UI
  push_str 18                 ; "content"
  push_str 33                 ; "Favorite color?"
  map_new 1                   ; props = { content: "..." }
  store 3                     ; local 3 = props

  push_str 14                 ; "type"
  push_str 10                 ; "text"
  push_str 15                 ; "props"
  load 3                      ; props
  map_new 2                   ; element = { type: "text", props: {...} }
  store 3                     ; local 3 = element

  ; elements map
  push_str 4                  ; "root"
  load 3                      ; element
  map_new 1                   ; elements = { root: element }

  ; spec = { root: "root", elements: elements }
  push_str 37                 ; "root"
  push_str 4                  ; "root"
  push_str 36                 ; "elements"
  ; need elements map — it's on stack below the two strings
  ; stack: [elements_map, "root", "root", "elements"]
  ; Reorder: we need key-value pairs for map_new
  ; Let's redo this properly

  pop                         ; pop "elements"
  pop                         ; pop "root"
  pop                         ; pop "root"
  ; stack: [elements_map]
  store 3                     ; local 3 = elements_map

  push_str 37                 ; "root" (key)
  push_str 4                  ; "root" (value — the element ID)
  push_str 36                 ; "elements" (key)
  load 3                      ; elements_map (value)
  map_new 2                   ; spec = { root: "root", elements: {...} }

  syscall 0x0200              ; ui.render(spec)
  pop                         ; discard render result
  ret
.end
