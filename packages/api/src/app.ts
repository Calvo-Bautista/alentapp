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
import { MemberController } from './delivery/MemberController.js';
import { PaymentController } from './delivery/PaymentController.js';
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { MedicalCertificateValidator } from './domain/services/MedicalCertificateValidator.js';
import { CreateMedicalCertificateUseCase } from './application/NewMedicalCertificateUseCase.js';
import { UpdateMedicalCertificateUseCase } from './application/UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';

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
    const certificateRepo = new PostgresMedicalCertificateRepository();


    // Validadores
    const memberValidator = new MemberValidator(memberRepo);
    const paymentValidator = new PaymentValidator(memberRepo, paymentRepo);
    const certificateValidator = new MedicalCertificateValidator(memberRepo);


    // Casos de Uso Member
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    // Casos de Uso Payment
    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, paymentValidator);

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

    // Rutas Member
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // Rutas Payment
    server.post('/api/v1/pagos', paymentController.create.bind(paymentController));

    // Rutas MedicalCertificate
    server.post('/api/v1/medical-certificates', medicalCertificateController.create.bind(medicalCertificateController));
    server.put('/api/v1/medical-certificates/:id', medicalCertificateController.update.bind(medicalCertificateController));

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