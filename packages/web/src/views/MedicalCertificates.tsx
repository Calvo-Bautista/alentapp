import { 
  Table, Button, Heading, HStack, IconButton, Stack, Text, Box, Flex, Spinner, Center, Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { medicalCertificatesService } from "../services/medicalCertificates";
import { membersService } from "../services/members";
import type { MedicalCertificateDTO, CreateMedicalCertificateRequest, MemberDTO } from "@alentapp/shared";
import { 
  DialogRoot, DialogContent, DialogHeader, DialogTitle, 
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem, createListCollection 
} from "../components/ui/select";

const validationStatus = createListCollection({
    items: [
        { label: "Validado", value: "true" },
        { label: "No validado", value: "false" },
    ],
});

export function MedicalCertificatesView() {
    // Datos de la API
    const [certificates, setCertificates] = useState<MedicalCertificateDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);

    // UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtro: qué socio estamos viendo
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');

    // Modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCertId, setEditingCertId] = useState<string | null>(null);

    // Formulario
    const [formData, setFormData] = useState<CreateMedicalCertificateRequest & { is_validated?: boolean }>({
        member_id: '',
        issue_date: '',
        expiry_date: '',
        doctor_license: '',
    });

    // 1. Cargar socios (para el select y para mostrar nombres en la tabla)
    const fetchMembers = async () => {
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (err: any) {
            console.error('Error cargando socios:', err.message);
        }
    };

    // 2. Cargar certificados del socio seleccionado
    const fetchCertificates = async (memberId: string) => {
        if (!memberId) return; // No buscar si no hay socio seleccionado
        setIsLoading(true);
        setError(null);
        try {
            const data = await medicalCertificatesService.getByMember(memberId);
            setCertificates(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los certificados");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Helper: obtener nombre del socio por ID
    const getMemberName = (memberId: string): string => {
        const member = members.find(m => m.id === memberId);
        return member ? member.name : memberId; // Si no lo encuentra, muestra el ID como fallback
    };

    // 4. Abrir modal para crear
    const openCreateModal = () => {
        setEditingCertId(null);
        setFormData({ member_id: selectedMemberId || '', issue_date: '', expiry_date: '', doctor_license: '' });
        setIsDialogOpen(true);
    };

    // 5. Abrir modal para editar
    const openEditModal = (cert: MedicalCertificateDTO) => {
        setEditingCertId(cert.id);
        setFormData({
            member_id: cert.member_id,
            issue_date: cert.issue_date,
            expiry_date: cert.expiry_date,
            doctor_license: cert.doctor_license,
            is_validated: cert.is_validated,
        });
        setIsDialogOpen(true);
    };

    // 6. Submit del formulario (crear o editar)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCertId) {
                // EDITAR: solo mandamos los campos que se pueden actualizar
                await medicalCertificatesService.update(editingCertId, {
                    issue_date: formData.issue_date,
                    expiry_date: formData.expiry_date,
                    doctor_license: formData.doctor_license,
                    is_validated: formData.is_validated,
                });
            } else {
                // CREAR: mandamos todo excepto is_validated
                await medicalCertificatesService.create({
                    member_id: formData.member_id,
                    issue_date: formData.issue_date,
                    expiry_date: formData.expiry_date,
                    doctor_license: formData.doctor_license,
                });
            }
            setIsDialogOpen(false);
            // Refrescar la tabla solo si hay un socio seleccionado
            if (selectedMemberId) fetchCertificates(selectedMemberId);
        } catch (err: any) {
            alert(err.message || "Error al guardar el certificado");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 7. Eliminar certificado
    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este certificado? Esta acción no se puede deshacer.')) {
            try {
                await medicalCertificatesService.delete(id);
                if (selectedMemberId) fetchCertificates(selectedMemberId);
            } catch (err: any) {
                alert(err.message || "Error al eliminar el certificado");
            }
        }
    };

    // 8. Effects: cargar socios al montar el componente
    useEffect(() => {
        fetchMembers();
    }, []);

    // 9. Effect: cuando cambia el socio seleccionado, cargar sus certificados
    useEffect(() => {
        if (selectedMemberId) {
            fetchCertificates(selectedMemberId);
        } else {
            setCertificates([]); // Limpiar tabla si no hay socio seleccionado
        }
    }, [selectedMemberId]);

        // Crear la colección de socios para el SelectRoot
    const membersCollection = createListCollection({
        items: members.map(m => ({ label: m.name, value: m.id })),
    });

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <Stack gap="8">
                {/* ===== HEADER ===== */}
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Administración de Certificados Médicos</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona los certificados de salud de los socios del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button variant="outline" onClick={() => selectedMemberId && fetchCertificates(selectedMemberId)} disabled={isLoading || !selectedMemberId}>
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                            <LuPlus /> Agregar Certificado
                        </Button>
                    </HStack>
                </Flex>

                {/* ===== FILTRO POR SOCIO ===== */}
                <Box>
                    <Field label="Filtrar por socio">
                        <SelectRoot 
                            collection={membersCollection}
                            value={selectedMemberId ? [selectedMemberId] : []}
                            onValueChange={(e) => setSelectedMemberId(e.value[0] || '')}
                        >
                            <SelectTrigger>
                                <SelectValueText placeholder="Seleccione un socio para ver sus certificados" />
                            </SelectTrigger>
                            <SelectContent>
                                {membersCollection.items.map((item) => (
                                    <SelectItem item={item} key={item.value}>{item.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Field>
                </Box>

                {/* ===== MODAL CREAR/EDITAR ===== */}
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingCertId ? "Editar Certificado" : "Agregar Nuevo Certificado"}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                {/* Socio (solo al crear, porque no se puede cambiar el socio de un cert existente) */}
                                {!editingCertId && (
                                    <Field label="Socio" required>
                                        <SelectRoot
                                            collection={membersCollection}
                                            value={formData.member_id ? [formData.member_id] : []}
                                            onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                                        >
                                            <SelectTrigger>
                                                <SelectValueText placeholder="Seleccione un socio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {membersCollection.items.map((item) => (
                                                    <SelectItem item={item} key={item.value}>{item.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectRoot>
                                    </Field>
                                )}

                                <Field label="Fecha de Emisión" required>
                                    <Input 
                                        type="date" 
                                        value={formData.issue_date}
                                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                        required
                                    />
                                </Field>

                                <Field label="Fecha de Vencimiento" required>
                                    <Input 
                                        type="date" 
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        required
                                    />
                                </Field>

                                <Field label="Matrícula del Médico" required>
                                    <Input 
                                        placeholder="Ej. MN 12345" 
                                        value={formData.doctor_license}
                                        onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                                        required
                                    />
                                </Field>

                                {/* Validado (solo al editar) */}
                                {editingCertId && (
                                    <Field label="Estado de Validación">
                                        <SelectRoot
                                            collection={validationStatus}
                                            value={[String(formData.is_validated)]}
                                            onValueChange={(e) => setFormData({ ...formData, is_validated: e.value[0] === "true" })}
                                        >
                                            <SelectTrigger>
                                                <SelectValueText placeholder="Seleccione el estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {validationStatus.items.map((item) => (
                                                    <SelectItem item={item} key={item.value}>{item.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectRoot>
                                    </Field>
                                )}
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                {editingCertId ? "Guardar Cambios" : "Crear Certificado"}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {/* ===== ERROR BOX ===== */}
                {error && (
                    <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{error}</Text>
                    </Box>
                )}

                {/* ===== TABLA ===== */}
                <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" position="relative">
                    {!selectedMemberId ? (
                        <Center h="300px">
                            <Text color="fg.muted">Seleccioná un socio para ver sus certificados médicos.</Text>
                        </Center>
                    ) : isLoading ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">Cargando certificados...</Text>
                            </Stack>
                        </Center>
                    ) : certificates.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">Este socio no tiene certificados médicos.</Text>
                                <Button variant="ghost" onClick={() => fetchCertificates(selectedMemberId)}>Reintentar</Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Emisión</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Matrícula</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {certificates.map((cert) => (
                                    <Table.Row key={cert.id} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell fontWeight="semibold" color="fg.emphasized">
                                            {getMemberName(cert.member_id)}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">{cert.issue_date}</Table.Cell>
                                        <Table.Cell color="fg.muted">{cert.expiry_date}</Table.Cell>
                                        <Table.Cell color="fg.muted">{cert.doctor_license}</Table.Cell>
                                        <Table.Cell>
                                            <Box 
                                                display="inline-block" px="2" py="0.5" borderRadius="md"
                                                bg={cert.is_validated ? 'green.50' : 'red.50'} 
                                                color={cert.is_validated ? 'green.700' : 'red.700'} 
                                                fontSize="xs" fontWeight="bold"
                                            >
                                                {cert.is_validated ? 'Validado' : 'No validado'}
                                            </Box>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <HStack gap="2" justify="flex-end">
                                                <IconButton variant="ghost" size="sm" aria-label="Editar certificado"
                                                    onClick={() => openEditModal(cert)}>
                                                    <LuPencil />
                                                </IconButton>
                                                <IconButton variant="ghost" size="sm" colorPalette="red" aria-label="Eliminar certificado"
                                                    onClick={() => handleDelete(cert.id)}>
                                                    <LuTrash2 />
                                                </IconButton>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}


