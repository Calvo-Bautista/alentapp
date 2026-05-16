import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { CreatePaymentUseCase } from './application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from './application/DeletePaymentUseCase.js';
import { MemberController } from './delivery/MemberController.js';
import { PaymentController } from './delivery/PaymentController.js';
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { MedicalCertificateValidator } from './domain/services/MedicalCertificateValidator.js';
import { CreateMedicalCertificateUseCase } from './application/NewMedicalCertificateUseCase.js';
import { UpdateMedicalCertificateUseCase } from './application/UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { CreateDisciplineUseCase } from './application/CreateDisciplineUseCase.js';
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { UpdateDisciplineUseCase } from './application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                }
                : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // Repositorios
    const memberRepo = new PostgresMemberRepository();
    const paymentRepo = new PostgresPaymentRepository(memberRepo['prisma']); // Usamos la misma instancia de prisma
    const certificateRepo = new PostgresMedicalCertificateRepository(memberRepo['prisma']);

    const disciplineRepo = new PostgresDisciplineRepository(memberRepo['prisma']);

    // Validadores
    const memberValidator = new MemberValidator(memberRepo);
    const paymentValidator = new PaymentValidator(memberRepo, paymentRepo);
    const certificateValidator = new MedicalCertificateValidator(memberRepo);

    const disciplineValidator = new DisciplineValidator(disciplineRepo, memberRepo);

    // Casos de Uso Member
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);


    // Casos de Uso Payment
    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, paymentValidator);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo);
    const deletePaymentUseCase = new DeletePaymentUseCase(paymentRepo);
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo);

    // Casos de Uso Discipline
    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, disciplineValidator);
    const updateDisciplineUseCase = new UpdateDisciplineUseCase(disciplineRepo, disciplineValidator);

    // Casos de Uso MedicalCertificate
    const createCertificateUseCase = new CreateMedicalCertificateUseCase(certificateRepo, certificateValidator);
    const updateCertificateUseCase = new UpdateMedicalCertificateUseCase(certificateRepo, certificateValidator);

    // Controladores
    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );
    
    const paymentController = new PaymentController(createPaymentUseCase);

    
    const medicalCertificateController = new MedicalCertificateController(
        createCertificateUseCase,
        updateCertificateUseCase,
    );

    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        updateDisciplineUseCase,
        deleteDisciplineUseCase
    );

    const paymentController = new PaymentController(
        createPaymentUseCase,
        getPaymentsUseCase,
        deletePaymentUseCase
    );

    // Rutas Member
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // Rutas Payment
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.delete('/api/v1/payments/:id/cancel', paymentController.delete.bind(paymentController));
    
    // TDD-0012: Intento de DELETE físico debe retornar 405
    server.delete('/api/v1/payments/:id', async (req, rep) => {
        return rep.status(405).send({ error: 'Método no permitido. Use /cancel para anulación lógica.' });
    });

    // Rutas MedicalCertificate
    server.post('/api/v1/medical-certificates', medicalCertificateController.create.bind(medicalCertificateController));
    server.put('/api/v1/medical-certificates/:id', medicalCertificateController.update.bind(medicalCertificateController));
    // Rutas Discipline
    server.post('/api/v1/disciplinas', disciplineController.create.bind(disciplineController));
    server.put('/api/v1/disciplinas/:id', disciplineController.update.bind(disciplineController));
    server.delete('/api/v1/disciplinas/:id', disciplineController.delete.bind(disciplineController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}