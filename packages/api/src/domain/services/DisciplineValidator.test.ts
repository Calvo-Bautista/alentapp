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

    
})


