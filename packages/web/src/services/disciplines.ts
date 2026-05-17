import type { DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const disciplinesService = {
    async getByMember(memberId: string): Promise<DisciplineDTO[]> {
        const response = await fetch(`${API_URL}/disciplinas/socio/${memberId}`);
        if (!response.ok) {
            throw new Error('Error al obtener las sanciones');
        }
        const result = await response.json();
        return result.data;
    },

    async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        const response = await fetch(`${API_URL}/disciplinas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la sanción');
        }
        const result = await response.json();
        return result.data;
    },

    async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        const response = await fetch(`${API_URL}/disciplinas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar la sanción');
        }
        const result = await response.json();
        return result.data;
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/disciplinas/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la sanción');
        }
    },
};
