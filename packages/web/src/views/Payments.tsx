import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Center,
  Badge,
  IconButton,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuTrash2, LuDollarSign } from "react-icons/lu";
import { useState, useEffect, useCallback } from "react";
import { paymentsService } from "../services/payments";
import { membersService } from "../services/members";
import type { PaymentWithMemberDTO, MemberDTO, CreatePaymentRequest } from "@alentapp/shared";
import { toaster } from "../components/ui/toaster";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentWithMemberDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    member_id: "",
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: new Date().toISOString().split('T')[0],
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentsService.getAll();
      setPayments(data as PaymentWithMemberDTO[]);
    } catch (error: any) {
      toaster.create({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (error: any) {
      console.error("Error fetching members:", error);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, [fetchPayments, fetchMembers]);

  const handlePayPayment = async (id: string) => {
    if (!confirm("¿Desea marcar este pago como COBRADO?")) return;
    
    try {
      await paymentsService.update(id, { status: 'Paid' });
      toaster.create({
        title: "Pago cobrado",
        description: "Se ha registrado el cobro exitosamente.",
        type: "success",
      });
      fetchPayments();
    } catch (error: any) {
      toaster.create({
        title: "Error al cobrar",
        description: error.message,
        type: "error",
      });
    }
  };

  const handleCancelPayment = async (id: string) => {
    if (!confirm("¿Está seguro que desea cancelar este pago?")) return;
    
    try {
      await paymentsService.cancel(id);
      toaster.create({
        title: "Pago cancelado",
        description: "El registro ha sido anulado correctamente.",
        type: "success",
      });
      fetchPayments();
    } catch (error: any) {
      toaster.create({
        title: "Error al cancelar",
        description: error.message,
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      toaster.create({ title: "Error", description: "Debe seleccionar un socio", type: "error" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await paymentsService.create(formData);
      toaster.create({
        title: "Éxito",
        description: "Pago registrado correctamente",
        type: "success",
      });
      setIsDialogOpen(false);
      fetchPayments();
    } catch (error: any) {
      toaster.create({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const membersCollection = createListCollection({
    items: members.map(m => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id }))
  });

  const monthsCollection = createListCollection({
    items: Array.from({ length: 12 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))
  });

  const yearsCollection = createListCollection({
    items: [
      { label: (new Date().getFullYear() - 1).toString(), value: (new Date().getFullYear() - 1).toString() },
      { label: new Date().getFullYear().toString(), value: new Date().getFullYear().toString() },
      { label: (new Date().getFullYear() + 1).toString(), value: (new Date().getFullYear() + 1).toString() },
    ]
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return <Badge colorPalette="green" variant="solid">Pagado</Badge>;
      case 'Pending': return <Badge colorPalette="orange" variant="solid">Pendiente</Badge>;
      case 'Canceled': return <Badge colorPalette="red" variant="solid">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Visualiza y registra los pagos y deudas de los socios.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchPayments} disabled={isLoading} loading={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={() => setIsDialogOpen(true)}>
              <LuPlus /> Registrar Pago
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot 
                    collection={membersCollection} 
                    value={[formData.member_id]}
                    onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {membersCollection.items.map((item) => (
                        <SelectItem item={item} key={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Monto" required>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </Field>

                <HStack gap="4">
                  <Field label="Mes" required>
                    <SelectRoot 
                      collection={monthsCollection} 
                      value={[formData.month.toString()]}
                      onValueChange={(e) => setFormData({ ...formData, month: parseInt(e.value[0]) })}
                    >
                      <SelectTrigger>
                        <SelectValueText />
                      </SelectTrigger>
                      <SelectContent>
                        {monthsCollection.items.map((item) => (
                          <SelectItem item={item} key={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </DialogRoot>
                  </Field>

                  <Field label="Año" required>
                    <SelectRoot 
                      collection={yearsCollection} 
                      value={[formData.year.toString()]}
                      onValueChange={(e) => setFormData({ ...formData, year: parseInt(e.value[0]) })}
                    >
                      <SelectTrigger>
                        <SelectValueText />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsCollection.items.map((item) => (
                          <SelectItem item={item} key={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                </HStack>

                <Field label="Fecha de Vencimiento" required>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Registrar Pago
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        <Box 
          bg="bg.panel" 
          borderRadius="xl" 
          boxShadow="sm" 
          borderWidth="1px" 
          overflow="hidden"
          minH="300px"
        >
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Período</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="right">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payments.map((payment) => (
                <Table.Row key={payment.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    {payment.member_name}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {payment.month}/{payment.year}
                  </Table.Cell>
                  <Table.Cell fontWeight="bold">
                    ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {payment.due_date}
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(payment.status)}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        aria-label="Registrar cobro"
                        variant="ghost"
                        colorPalette="green"
                        size="sm"
                        disabled={payment.status !== 'Pending'}
                        onClick={() => handlePayPayment(payment.id)}
                      >
                        <LuDollarSign />
                      </IconButton>
                      <IconButton
                        aria-label="Cancelar pago"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        disabled={payment.status !== 'Pending'}
                        onClick={() => handleCancelPayment(payment.id)}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {payments.length === 0 && !isLoading && (
            <Center h="200px">
              <Text color="fg.muted">No hay pagos registrados.</Text>
            </Center>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}
