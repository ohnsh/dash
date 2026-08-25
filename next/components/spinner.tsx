import css from './spinner.module.css'

export default function Spinner() {
  return (
    <div className={css['spinner-container']}>
      <div className={css['loading-spinner']}></div>
    </div>
  )
}
