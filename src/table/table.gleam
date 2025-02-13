import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html

pub type Model =
  Int

pub type Msg {
  Init
}

pub fn main() {
  let app = app()
  let assert Ok(_) = lustre.start(app, "#app", 0)
}

pub fn app() {
  lustre.application(init, update, view)
}

pub fn init(_flags) -> #(Model, Effect(Msg)) {
  #(0, effect.none())
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    Init -> #(model, effect.none())
  }
}

pub fn view(_model: Model) -> Element(Msg) {
  html.div([], [element.text("table-component")])
}
