import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberRepository } from '../MemberRepository.js';
import { DisciplineValidator } from './DisciplineValidator.js';
import { DisciplineRepository } from '../DisciplineRepository.js';

describe("DisciplineValidator", ()=>{
    const mockDisciplineRepo = {
        
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        
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
    })

    
})


