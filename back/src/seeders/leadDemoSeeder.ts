import { leadService } from '@app/domains/lead/leadService'
import { Lead, Program } from '@app/models'
import { IConsole } from '@client/client'

export const run = async(_params, console:IConsole) => {
  try{
    const programs = await Program.find({}).sort({name:1}).lean()
    if(!programs.length){
      console.warn('No hay programas registrados. Ejecuta primero programSeeder.')
      return false
    }

    const leads = [
      { first_name: 'María', last_name: 'Gómez', email: 'maria.gomez@example.com', mobile_phone: '3104567821' },
      { first_name: 'Juan', last_name: 'Rodríguez', email: 'juan.rodriguez@example.com', mobile_phone: '3157894512' },
      { first_name: 'Valentina', last_name: 'López', email: 'valentina.lopez@example.com', mobile_phone: '3008765432' },
      { first_name: 'Santiago', last_name: 'Martínez', email: 'santiago.martinez@example.com', mobile_phone: '3126549873' },
      { first_name: 'Camila', last_name: 'Hernández', email: 'camila.hernandez@example.com', mobile_phone: '3201239876' },
      { first_name: 'Andrés', last_name: 'García', email: 'andres.garcia@example.com', mobile_phone: '3017412589' },
      { first_name: 'Daniela', last_name: 'Ramírez', email: 'daniela.ramirez@example.com', mobile_phone: '3185296374' },
      { first_name: 'Sebastián', last_name: 'Torres', email: 'sebastian.torres@example.com', mobile_phone: '3043698521' },
      { first_name: 'Laura', last_name: 'Díaz', email: 'laura.diaz@example.com', mobile_phone: '3112583697' },
      { first_name: 'Felipe', last_name: 'Castro', email: 'felipe.castro@example.com', mobile_phone: '3226547891' },
      { first_name: 'Natalia', last_name: 'Vargas', email: 'natalia.vargas@example.com', mobile_phone: '3159517536' },
      { first_name: 'Carlos', last_name: 'Moreno', email: 'carlos.moreno@example.com', mobile_phone: '3027539514' },
      { first_name: 'Juliana', last_name: 'Rojas', email: 'juliana.rojas@example.com', mobile_phone: '3168524697' },
      { first_name: 'Diego', last_name: 'Ortiz', email: 'diego.ortiz@example.com', mobile_phone: '3054561238' },
      { first_name: 'Sofía', last_name: 'Jiménez', email: 'sofia.jimenez@example.com', mobile_phone: '3136985214' },
      { first_name: 'Mateo', last_name: 'Ruiz', email: 'mateo.ruiz@example.com', mobile_phone: '3217418529' },
      { first_name: 'Isabella', last_name: 'Mendoza', email: 'isabella.mendoza@example.com', mobile_phone: '3009632587' },
      { first_name: 'Alejandro', last_name: 'Suárez', email: 'alejandro.suarez@example.com', mobile_phone: '3143571598' },
      { first_name: 'Mariana', last_name: 'Peña', email: 'mariana.pena@example.com', mobile_phone: '3192587413' },
      { first_name: 'Nicolás', last_name: 'Cárdenas', email: 'nicolas.cardenas@example.com', mobile_phone: '3038527419' },
      { first_name: 'Paula', last_name: 'Guerrero', email: 'paula.guerrero@example.com', mobile_phone: '3174185296' },
      { first_name: 'David', last_name: 'Ospina', email: 'david.ospina@example.com', mobile_phone: '3061597534' },
      { first_name: 'Gabriela', last_name: 'Muñoz', email: 'gabriela.munoz@example.com', mobile_phone: '3118529637' },
      { first_name: 'Esteban', last_name: 'Restrepo', email: 'esteban.restrepo@example.com', mobile_phone: '3207896541' },
      { first_name: 'Luisa', last_name: 'Salazar', email: 'luisa.salazar@example.com', mobile_phone: '3145632178' },
      { first_name: 'Tomás', last_name: 'Arango', email: 'tomas.arango@example.com', mobile_phone: '3012369874' },
      { first_name: 'Manuela', last_name: 'Quintero', email: 'manuela.quintero@example.com', mobile_phone: '3186547823' },
      { first_name: 'Samuel', last_name: 'Pineda', email: 'samuel.pineda@example.com', mobile_phone: '3047896325' },
      { first_name: 'Ángela', last_name: 'Duque', email: 'angela.duque@example.com', mobile_phone: '3123214569' },
      { first_name: 'Óscar', last_name: 'Valencia', email: 'oscar.valencia@example.com', mobile_phone: '3219873216' },
      { first_name: 'Carolina', last_name: 'Henao', email: 'carolina.henao@example.com', mobile_phone: '3166543217' },
      { first_name: 'Julián', last_name: 'Zapata', email: 'julian.zapata@example.com', mobile_phone: '3025478963' },
    ]

    for (const [index, lead] of leads.entries()) {
      const exists = await Lead.findOne({email: lead.email}).lean()
      if(exists) continue

      const response = await leadService.upsert({...lead, interestProgram: programs[index % programs.length]._id})
      if(response?.code !== 200){
        console.log('error', response)
        return false
      }
    }
  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}
