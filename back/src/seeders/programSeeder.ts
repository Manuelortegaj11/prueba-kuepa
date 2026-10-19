import { Program } from '@app/models'
import { IConsole } from '@client/client'

export const run = async(_params, console:IConsole) => {
  try{
    const programs = [
      { name: 'Bachiller académico' },
      { name: 'Técnico laboral en Auxiliar Administrativo' },
      { name: 'Técnico laboral en Mercadeo y Ventas' },
      { name: 'Técnico laboral en Contabilidad y Finanzas' },
      { name: 'Técnico laboral en Procesamiento y Digitación de Datos' },
      { name: 'Técnico laboral en Hotelería y Turismo' },
      { name: 'Técnico laboral en Soporte TIC' },
      { name: 'Técnico laboral en Recursos Humanos' },
    ]

    for (const program of programs) {
      const exists = await Program.findOne({name: program.name}).lean()
      if(!exists){
        await Program.create(program)
      }
    }
  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}
