import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input,
    Badge,
    Checkbox,
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw, LuDumbbell } from "react-icons/lu";
import { useEffect, useState } from "react";
import { sportsService } from "../services/sports";
import type { SportDTO, CreateSportRequest, UpdateSportRequest } from "@alentapp/shared";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

type CreateFormData = CreateSportRequest;
type EditFormData = UpdateSportRequest;

const defaultCreateForm: CreateFormData = {
    name: "",
    description: "",
    max_capacity: 1,
    additional_price: 0,
    requires_medical_certificate: false,
};

const defaultEditForm: EditFormData = {
    description: "",
    max_capacity: 1,
    additional_price: 0,
    requires_medical_certificate: false,
};

export function SportsView() {
    const [sports, setSports] = useState<SportDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSport, setEditingSport] = useState<SportDTO | null>(null);

    const [createForm, setCreateForm] = useState<CreateFormData>(defaultCreateForm);
    const [editForm, setEditForm] = useState<EditFormData>(defaultEditForm);

    const fetchSports = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await sportsService.getAll();
            setSports(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los deportes");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingSport(null);
        setCreateForm(defaultCreateForm);
        setIsDialogOpen(true);
    };

    const openEditModal = (sport: SportDTO) => {
        setEditingSport(sport);
        setEditForm({
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingSport) {
                await sportsService.update(editingSport.id, editForm);
            } else {
                await sportsService.create(createForm);
            }
            setIsDialogOpen(false);
            fetchSports();
        } catch (err: any) {
            alert(err.message || "Error al guardar el deporte");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el deporte "${name}"? Esta acción no se puede deshacer.`)) {
            try {
                await sportsService.delete(id);
                fetchSports();
            } catch (err: any) {
                alert(err.message || "Error al eliminar el deporte");
            }
        }
    };

    useEffect(() => {
        fetchSports();
    }, []);

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Administración de Deportes</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona las disciplinas deportivas disponibles en el club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button variant="outline" onClick={fetchSports} disabled={isLoading}>
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                            <LuPlus /> Agregar Deporte
                        </Button>
                    </HStack>
                </Flex>

                {/* Modal crear / editar */}
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingSport ? "Editar Deporte" : "Agregar Nuevo Deporte"}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                {/* El campo nombre solo aparece al crear — es inmutable tras la creación */}
                                {!editingSport && (
                                    <Field label="Nombre" required>
                                        <Input
                                            placeholder="Ej. Tenis"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                            required
                                        />
                                    </Field>
                                )}

                                <Field label="Descripción" required>
                                    <Input
                                        placeholder="Ej. Deporte de raqueta individual o dobles"
                                        value={editingSport ? editForm.description ?? "" : createForm.description}
                                        onChange={(e) =>
                                            editingSport
                                                ? setEditForm({ ...editForm, description: e.target.value })
                                                : setCreateForm({ ...createForm, description: e.target.value })
                                        }
                                        required
                                    />
                                </Field>

                                <Field label="Cupo máximo" required>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Ej. 20"
                                        value={editingSport ? editForm.max_capacity ?? "" : createForm.max_capacity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            editingSport
                                                ? setEditForm({ ...editForm, max_capacity: val })
                                                : setCreateForm({ ...createForm, max_capacity: val });
                                        }}
                                        required
                                    />
                                </Field>

                                <Field label="Precio adicional ($)">
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        placeholder="Ej. 500"
                                        value={editingSport ? editForm.additional_price ?? "" : createForm.additional_price}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            editingSport
                                                ? setEditForm({ ...editForm, additional_price: val })
                                                : setCreateForm({ ...createForm, additional_price: val });
                                        }}
                                    />
                                </Field>

                                <Field label="Requiere certificado médico">
                                    <Checkbox.Root
                                        checked={editingSport ? editForm.requires_medical_certificate ?? false : createForm.requires_medical_certificate}
                                        onCheckedChange={(details) => {
                                            const val = !!details.checked;
                                            editingSport
                                                ? setEditForm({ ...editForm, requires_medical_certificate: val })
                                                : setCreateForm({ ...createForm, requires_medical_certificate: val });
                                        }}
                                    >

                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Label>Sí, se requiere</Checkbox.Label>
                                    </Checkbox.Root>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                {editingSport ? "Guardar cambios" : "Crear deporte"}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {/* Tabla */}
                <Box>
                    {isLoading ? (
                        <Center py="20">
                            <Spinner size="xl" color="blue.500" />
                        </Center>
                    ) : error ? (
                        <Center py="20">
                            <Text color="red.500">{error}</Text>
                        </Center>
                    ) : sports.length === 0 ? (
                        <Center py="20" flexDirection="column" gap="4">
                            <LuDumbbell size={48} color="gray" />
                            <Text color="fg.muted">No hay deportes registrados aún.</Text>
                        </Center>
                    ) : (
                        <Table.Root variant="outline" size="md">
                            <Table.Header>
                                <Table.Row bg="bg.subtle">
                                    <Table.ColumnHeader fontWeight="bold">Nombre</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="bold">Descripción</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="bold" textAlign="center">Cupo</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="bold" textAlign="center">Precio adicional</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="bold" textAlign="center">Cert. médico</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="bold" textAlign="center">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {sports.map((sport) => (
                                    <Table.Row key={sport.id} _hover={{ bg: "bg.subtle" }}>
                                        <Table.Cell fontWeight="semibold">{sport.name}</Table.Cell>
                                        <Table.Cell color="fg.muted">{sport.description}</Table.Cell>
                                        <Table.Cell textAlign="center">{sport.max_capacity}</Table.Cell>
                                        <Table.Cell textAlign="center">
                                            ${sport.additional_price.toLocaleString("es-AR")}
                                        </Table.Cell>
                                        <Table.Cell textAlign="center">
                                            <Badge
                                                colorPalette={sport.requires_medical_certificate ? "orange" : "green"}
                                                variant="subtle"
                                            >
                                                {sport.requires_medical_certificate ? "Requerido" : "No requerido"}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <HStack justify="center" gap="2">
                                                <IconButton
                                                    aria-label="Editar deporte"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(sport)}
                                                >
                                                    <LuPencil />
                                                </IconButton>
                                                <IconButton
                                                    aria-label="Eliminar deporte"
                                                    variant="ghost"
                                                    size="sm"
                                                    colorPalette="red"
                                                    onClick={() => handleDelete(sport.id, sport.name)}
                                                >
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