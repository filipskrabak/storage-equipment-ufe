import '@material/web/list/list'
import '@material/web/list/list-item'
import '@material/web/icon/icon'
import '@material/web/button/filled-button'
import '@material/web/button/text-button'
import '@material/web/button/outlined-button'
import '@material/web/textfield/outlined-text-field'
import '@material/web/select/outlined-select'
import '@material/web/select/select-option'
import '@material/web/dialog/dialog'
import '@material/web/chips/chip-set'
import '@material/web/chips/filter-chip'
import '@material/web/chips/assist-chip'
import '@material/web/progress/linear-progress'
import '@material/web/progress/circular-progress'
import '@material/web/divider/divider'
import { registerNavigationApi } from './navigation.js'

export default function() { // or export default async function()
  // package initialization code
  registerNavigationApi()
}
