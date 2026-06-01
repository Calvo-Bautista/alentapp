import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberRepository } from '../MemberRepository.js';
import { DisciplineValidator } from './DisciplineValidator.js';
import { DisciplineRepository } from '../DisciplineRepository.js';

describe("DisciplineValidator", ()=>{
    const mockDisciplineRepo = {
        
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new DisciplineValidator(mockDisciplineRepo, mockMemberRepo);
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("validateDates",()=>{
        it("debe pasar correctamente si la fecha inicio es menor a la fecha fin", () => {
            expect(() => validator.validateDates('2022-01-01', '2022-01-02')).not.toThrow();
            expect(() => validator.validateDates('2021-05-27', '2022-01-02')).not.toThrow();
        });

        it("debe lanzar un error si la fecha inicio es mayor a la fecha fin", () => {
            expect(() => validator.validateDates('2022-01-02', '2022-01-01')).toThrow('La fecha de inicio debe ser menor a la fecha de fin');
            expect(() => validator.validateDates('2022-05-27', '2021-10-29')).toThrow('La fecha de inicio debe ser menor a la fecha de fin');
        })

        it("debe pasar correctamente si la fecha inicio es igual a la fecha fin", ()=> {
            expect(() => validator.validateDates('2022-01-01', '2022-01-01')).not.toThrow();
            expect(() => validator.validateDates('2025-08-22', '2025-08-22')).not.toThrow();
        })

        it('debe lanzar error si falta la fecha de inicio', () => {
            expect(() => validator.validateDates('', '2022-01-02')).toThrow('La sanción debe tener un lapso de tiempo');
        });

        it('debe lanzar error si falta la fecha de fin', () => {
            expect(() => validator.validateDates('2022-01-01', '')).toThrow('La sanción debe tener un lapso de tiempo');
        });
    })

    describe('validateMemberExists', () => {
        it('debe pasar si el socio existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1' } as any);

            await expect(validator.validateMemberExists('member-1')).resolves.not.toThrow();
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-1');
        });

        it('debe lanzar error si el socio no existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

            await expect(validator.validateMemberExists('member-404')).rejects.toThrow('No existe ese socio en el club');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-404');
        });
    });
    
})


