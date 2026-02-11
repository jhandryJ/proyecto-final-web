
import { prisma } from '../utils/prisma.js';

async function main() {
    try {
        console.log('Testing Create Championship...');

        const data = {
            nombre: "Test Championship",
            anio: 2026,
            fechaInicio: "2026-02-09T00:00:00.000Z",
            fechaFin: "",
            torneos: [
                {
                    disciplina: "FUTBOL",
                    categoria: "FASE_GRUPOS",
                    genero: "MASCULINO",
                    costoInscripcion: 10.50
                }
            ]
        };

        const date = new Date(data.fechaInicio);
        if (isNaN(date.getTime())) {
            console.error('Invalid Date simulated');
        }

        // Simulate what controller does
        const result = await prisma.$transaction(async (tx) => {
            const campeonato = await tx.campeonato.create({
                data: {
                    nombre: data.nombre,
                    anio: data.anio,
                    fechaInicio: new Date(data.fechaInicio)
                },
            });

            console.log('Campeonato Created:', campeonato.id);

            for (const torneo of data.torneos) {
                await tx.torneo.create({
                    data: {
                        campeonatoId: campeonato.id,
                        disciplina: torneo.disciplina,
                        categoria: torneo.categoria,
                        genero: torneo.genero,
                        costoInscripcion: torneo.costoInscripcion,
                        tipoSorteo: 'GRUPOS'
                    }
                });
                console.log('Torneo Create Call Success');
            }
            return campeonato;
        });

        console.log('Transaction Success:', result);

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
